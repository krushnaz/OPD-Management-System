const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');
const moment = require('moment');
const transporter  = require('../mail');
const {Doctor} = require('../../models/adminModel');
const {TimeSchedule} = require('../../models/doctorModel');
const {Appointment} = require('../../models/patientModel');

// Set up Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      // Set the destination folder where the uploaded image will be saved
      cb(null, './uploads/doctor');
  },
  filename: (req, file, cb) => {
      // Set the filename to be the current timestamp with the original file extension
      cb(null, Date.now() + '-' + file.originalname);
  }
});

// Set up Multer upload configuration
const upload = multer({ storage: storage });

const saveDoctorInfo = async (req, res) => {
  try {
      const { oldImage, mobile, gender, dob, biography, degrees, institutes, yearsOfCompletion, from, to, designation } = req.body;
  
      // Find the doctor by email
      const email = req.session.email;
      const doctor = await Doctor.findOne({ email });

      // If doctor not found, return error
      if (!doctor) {
           res.status(404).json({ message: 'Doctor not found' });
           res.redirect('/login');
      }

      // Update basic information
      doctor.mobile = mobile;
      doctor.gender = gender;
      doctor.dob = dob;
      doctor.biography = biography;

      if (req.file) {
        // Delete the old image file if it exists
        if (oldImage) {
            fs.unlinkSync(oldImage);
        }
          doctor.image = req.file.path;
      } else {
          // If no new image uploaded, use the existing image path or set it to null if not provided
          doctor.image = oldImage || null;
      }

      // Update education information
      doctor.education = [
        {
          degree : degrees,
          institute : institutes,
          yearOfCompletion : yearsOfCompletion,
        }
      ];

      // Update experience information
      doctor.experience = [
        {
          from : from,
          to : to,
          designation : designation,
        }
      ];

      // Save the updated doctor information
      await doctor.save();

      req.flash('success', 'Doctor information updated successfully');
      return res.redirect('/doctor-profile-settings');

  } catch (error) {
      req.flash('error', `Error saving doctor information : ${error}`);
      return res.redirect('/doctor-profile-settings');  
  }
};

const saveScheduleTime = async (req, res) => {
  try {
      // Extract form data from request body
      const { date, startTime, endTime, slotDuration } = req.body;

      const doctorEmail = req.session.email; // Assuming the doctor's email is stored in the session
      
      // Find the doctor by email
      const doctor = await Doctor.findOne({ email: doctorEmail });

      if (!doctor) {
          req.flash('error', 'Something Went Wrong, Doctor Not Found');
          return res.redirect('/login');
      }

      // Extract doctor's ID from the found doctor document
      const doctorId = doctor._id;

      // Call the controller function to generate and save slots
      await generateAndSaveSlots(doctorId, date, startTime, endTime, slotDuration);

      // Send a success response
      req.flash( 'success',  'Schedule time added successfully');
      return res.redirect('/schedule-timings');
      // res.status(200).send('Slots generated successfully');
  } catch (error) {
      // Handle errors
      console.error('Error generating slots:', error);
      res.status(500).send('Internal Server Error');
  }
};

async function generateAndSaveSlots(doctorId, date, startTime, endTime, slotDuration) {
  try {
    // Calculate the total number of slots
    const totalSlots = Math.ceil(moment(endTime, 'HH:mm').diff(moment(startTime, 'HH:mm'), 'minutes') / slotDuration);

    // Initialize an array to store the generated slots
    const slots = [];

    // Initialize the start time of the first slot
    let currentSlotStart = moment(startTime, 'HH:mm');

    // Loop to generate slots
    for (let i = 0; i < totalSlots; i++) {
      // Calculate the end time of the current slot
      const currentSlotEnd = currentSlotStart.clone().add(slotDuration, 'minutes');

      // Create a new slot object and push it to the array
      slots.push({
        doctor: doctorId,
        date: date,
        startTime: currentSlotStart.format('HH:mm'),
        endTime: currentSlotEnd.format('HH:mm'),
        slotDuration: slotDuration,
        status: 'start'
      });

      // Move to the start time of the next slot
      currentSlotStart = currentSlotEnd;
    }

    // Save slots to the database
    const savedSlots = await TimeSchedule.create(slots);
    // res.render('schedule-timings', {error: req.flash('error'), success: req.flash('success') });

  } catch (error) {
    console.error('Error generating and saving slots:', error);
    throw error; // Throw the error to be handled by the route
  }
}

const editScheduleTime = async (req, res) => {
  try {
      // Extract schedule ID from request parameters
      const scheduleId = req.params.scheduleId;

      // Find the schedule by ID
      const schedule = await TimeSchedule.findById(scheduleId);

      // Check if the schedule exists
      if (!schedule) {
        req.flash( 'error',  'Schedule not found')
        return res.redirect('/schedule-timings');
      }

      // Extract updated schedule details from request body
      const { date, slotDuration, startTime, endTime } = req.body;

      // Update the schedule with the new details
      schedule.date = date;
      schedule.slotDuration = slotDuration;
      schedule.startTime = startTime;
      schedule.endTime = endTime;

      // Save the updated schedule
      await schedule.save();
      req.flash( 'success',  'Schedule time updated successfully');
      return res.redirect('/schedule-timings'); 

  } catch (error) {
    console.log(error);
    req.flash( 'error',  'Internal Server Error');
    return res.redirect('/schedule-timings'); 
  }
};

const deleteSchedule = async (req, res) => {
  try {
    // Extract schedule ID from request parameters
    const scheduleId = req.params.scheduleId;

    // Find the schedule by ID
    const schedule = await TimeSchedule.findById(scheduleId);

    if (!schedule) {
      req.flash('error', 'Schedule not found');
      return res.redirect('/schedule-timings');
    }

    // Check if there is an associated appointment
    const appointment = await Appointment.findOne({ schedule: scheduleId });

    if (appointment) {
      // If there is an associated appointment, delete it
      await Appointment.findByIdAndDelete(appointment._id);
    }

    // Delete the schedule
    await TimeSchedule.findByIdAndDelete(scheduleId);

    // Send success response
    req.flash('success', 'Schedule time and associated appointment deleted successfully');
    return res.redirect('/schedule-timings');
  } catch (error) {
    console.error('Error deleting schedule and appointment:', error);
    req.flash('error', 'Error deleting schedule time and associated appointment');
    return res.redirect('/schedule-timings');
  }
};

const changePasswordDoctor = async (req, res) => {
  try {
      const { oldPassword, newPassword } = req.body;
      const email = req.session.email;

      // Retrieve the patient from the database based on the email
      const doctor = await Doctor.findOne({ email });

      // Check if the patient exists
      if (!doctor) {
          req.flash('error', 'Doctor not found');
          return res.redirect('/login');
      }

      // Validate the old password
      const isPasswordValid = await bcrypt.compare(oldPassword, doctor.password);
      if (!isPasswordValid) {
          req.flash('error', 'Incorrect old password');
          return res.redirect('/doctor-change-password');
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the patient's password
      doctor.password = hashedPassword;
      await doctor.save();

      // Send a flash message indicating success
      req.flash('success', 'Password changed successfully');

      // Optionally, send an email to the patient
      await transporter.sendMail({
          from: 'sangramonlinework99@gmail.com',
          to: doctor.email,
          subject: 'Password Changed Successfully for OPD Management System',
          html: `
              <p>Hello ${doctor.name},</p>
              <p>We're writing to inform you that your password has been successfully changed.</p>
              <p>If you did not make this change, please contact us immediately.</p>
              <p>For any queries or assistance, feel free to reach out to us.</p>
              <p>Warm regards,</p>
              <p>Sangram Patil and Krushna Zarekar</p>
              <p>95794 80968 / 93703 20066</p>
          `
      });

      // Redirect to profile settings page with success message
      res.redirect('/doctor-change-password');
  } catch (error) {
      console.error('Error changing password:', error);
      req.flash('error', 'Internal Server Error');
      res.redirect('/doctor-change-password');
  }
};

module.exports = {saveDoctorInfo,saveScheduleTime,editScheduleTime,deleteSchedule,upload,changePasswordDoctor}