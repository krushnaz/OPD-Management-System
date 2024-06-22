const express = require('express');
const router = express.Router();
const {registerPatient,savePatientInfo,upload,changePasswordPatient,saveAppointment} = require('../../controllers/patient/patient');
const {isPatient,getUserInfo} = require('../../controllers/auth/authMiddleware');
const {Patient,Appointment} = require('../../models/patientModel');
const {TimeSchedule} = require('../../models/doctorModel');
const {Doctor,Speciality} = require('../../models/adminModel');

// router.get('/patient-dashboard', isAuth, async (req, res) => {
//     try {
//         const user = req.user; // Fetch the user information from req.user

//         // Retrieve email ID from the session
//         const email = req.session.email;

//         // Fetch patient data from the database based on the email ID
//         const patient = await Patient.findOne({ email });

//         if (!patient) {
//             // Handle case where patient information is not found
//             return res.status(404).send('Patient not found');
//         }

//         // Fetch appointments booked by the patient and populate doctor and specialty information
//         const appointments = await Appointment.find({ patient: patient._id })
//             .populate({
//                 path: 'Doctor',
//                 populate: {
//                     path: 'Speciality',
//                     select: 'name' // Select only the 'name' field of the specialty
//                 }
//             });

//         // Render the patient dashboard page with patient information and appointments
//         res.render('patient-dashboard', { patient, appointments, success: req.flash('success'), error: req.flash('error') });
//     } catch (error) {
//         console.error('Error fetching patient data:', error);
//         res.status(500).send('Internal Server Error');
//     }
// });

router.get('/patient-dashboard', isPatient, async (req, res) => {
    try {  
      // Retrieve email ID from the session (assuming you use sessions)
      const email = req.session.email;
  
      // Fetch patient data from the database based on the email ID
      const patient = await Patient.findOne({ email });
  
      if (!patient) {
        // Handle case where patient information is not found
        return res.status(404).send('Patient not found');
      }
  
      // Fetch appointments booked by the patient and populate doctor and specialty information
      const appointments = await Appointment.find({ patient: patient._id })
        .populate({
          path: 'doctor',
          populate: {
            path: 'specialityId',
            select: 'name'
          }
        });
  
      // Render the patient dashboard page with patient information and appointments
      res.render('patient-dashboard', { patient, appointments, success: req.flash('success'), error: req.flash('error') });
    } catch (error) {
      console.error('Error fetching patient data:', error);
      res.status(500).send('Internal Server Error');
    }
});

router.get('/profile-settings', isPatient, getUserInfo, async (req, res) => {
    try {
        const user = req.user; // Fetch the user information from req.user

        // Retrieve email ID from the session
        const email = req.session.email;

        // Fetch patient data from the database based on the email ID
        const patient = await Patient.findOne({ email });

        if (patient) {
            // Render the profile settings page with patient information
            res.render('profile-settings', { patient, success: req.flash('success'), error: req.flash('error') });
        } else {
            // Handle case where patient information is not found
            res.status(404).send('Patient not found');
        }
    } catch (error) {
        console.error('Error fetching patient data:', error);
        res.status(500).send('Internal Server Error');
    }
});
  
router.get('/booking-appointment/:doctorId', isPatient,  async (req, res) => {
    try {
        // Extract the doctorId from the URL parameters
        const doctorId = req.params.doctorId;
        const selectedDate = req.query.date; // Retrieve the selected date from query parameters
        // Patient Email 
        const patientEmail = req.session.email;

        const patient = await Patient.findOne({email : patientEmail})

        if (!patient) {
            return res.status(404).send('Patient not found');
        }

        // Fetch the doctor details from the database using the doctorId
        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).send('Doctor not found');
        }

        // Fetch the time schedule for the doctor with status 'start'
        const timeSchedule = await TimeSchedule.find({ doctor: doctorId, date: selectedDate, status: 'start' });

        if (!timeSchedule) {
            return res.status(404).send('No available time schedule for booking');
        }

        // Fetch slots for the selected time schedule
        const slots = timeSchedule // Assuming slots are stored in the time schedule document

        // If the doctor, time schedule, and slots are found, render the appointment booking page
        res.render('booking', { doctor, selectedDate,patient, doctorId, timeSchedule, slots });
    } catch (error) {
        // Handle any errors that occur during the process
        console.error('Error fetching doctor details:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/patient-change-password', isPatient, async(req, res) => {
    try {
        const user = req.user; // Fetch the user information from req.user

        // Retrieve email ID from the session
        const email = req.session.email;

        // Fetch patient data from the database based on the email ID
        const patient = await Patient.findOne({ email });

        if (patient) {
            // Render the profile settings page with patient information
            res.render('change-password', { patient, error: req.flash('error'), success: req.flash('success') });
        } else {
            // Handle case where patient information is not found
            res.status(404).send('Patient not found');
        }
    } catch (error) {
        console.error('Error fetching patient data:', error);
        res.status(500).send('Internal Server Error');
    }
   
});

// router.get('/booking-success',isAuth, (req, res) => { 
//     res.render('booking-success');
// });

router.get('/add-invoice', (req, res) => {
    res.render('add-invoice');
});

router.get('/view-invoice', (req, res) => {
    res.render('view-invoice');
});

router.get('/view-prescription', (req, res) => {
    res.render('view-prescription');
});

router.get('/my-doctors', isPatient, async (req, res) => {
    try {
        const email = req.session.email;

        // Fetch patient data from the database based on the email ID
        const patient = await Patient.findOne({ email });

        // Fetch distinct doctor IDs from the TimeSchedule collection
        const distinctDoctorIds = await TimeSchedule.distinct('doctor', { status: 'no' });

        // Fetch all doctors whose IDs are in distinctDoctorIds array
        const doctors = await Doctor.find({ _id: { $in: distinctDoctorIds } });

        //Initially no date is selected
        const selectedDate = '';

        // Fetch specialty information for each doctor
        const doctorsWithSpecialty = await Promise.all(doctors.map(async (doctor) => {
            const specialty = await Speciality.findById(doctor.specialityId);
            // Adding the specialty name to the doctor object
            return {
                ...doctor.toObject(),
                specialtyName: specialty ? specialty.name : 'Unknown Specialty'
            };
        }));

        // Render the page with patient information and found doctors
        res.render('my-doctors', { patient, doctors: doctorsWithSpecialty, selectedDate, success: req.flash('success'), error: req.flash('error') });

    } catch (error) {
        console.error('Error fetching patient data:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/doctor-profile/:doctorId',  async(req, res) => {
    try {
        // Extract the doctorId from the URL parameters
        const doctorId = req.params.doctorId;

        // Fetch the doctor details from the database using the doctorId
        const doctor = await Doctor.findById(doctorId).populate('specialityId');

        if (doctor) {
            // If the doctor is found, render the doctor profile page with the doctor data
            res.render('doctor-profile', { doctor });
        } else {
            // If the doctor is not found, render an error page or redirect to another page
            res.status(404).send('Doctor not found');
        }
    } catch (error) {
        // Handle any errors that occur during the process
        console.error('Error fetching doctor profile:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/view-appointment',isPatient, (req, res) => {
    res.render('view-appointment');
});

//Register the patient 
router.post('/register-patient',  registerPatient);

//Patient Info
router.post('/update-patient-profile', isPatient, upload.single('image'), savePatientInfo);

//Change patient password
router.post('/change-patient-password', isPatient, changePasswordPatient);

router.post('/search-doctors', isPatient, async (req, res) => {
    try {
        const email = req.session.email;

        // Fetch patient data from the database based on the email ID
        const patient = await Patient.findOne({ email });

        const selectedDate = req.body.date;

        // Fetch distinct doctor IDs from the TimeSchedule collection based on the selected date and status 'start'
        const distinctDoctorIds = await TimeSchedule.distinct('doctor', { date: selectedDate, status: 'start' });

        // Fetch all doctors whose IDs are in distinctDoctorIds array
        const doctors = await Doctor.find({ _id: { $in: distinctDoctorIds } });

        // Fetch specialty information for each doctor
        const doctorsWithSpecialty = await Promise.all(doctors.map(async (doctor) => {
            const specialty = await Speciality.findById(doctor.specialityId);
            // Adding the specialty name to the doctor object
            return {
                ...doctor.toObject(),
                specialtyName: specialty ? specialty.name : 'Unknown Specialty'
            };
        }));

        // Send the list of available doctors back to the client
        res.render('my-doctors',{patient, doctors: doctorsWithSpecialty, selectedDate, success: req.flash('success'), error: req.flash('error') })
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/appointments',isPatient, saveAppointment);

// In your backend route handler
router.post('/cancel_appointment/:appointmentId', isPatient, async (req, res) => {
    try {
        const appointmentId = req.params.appointmentId;
        // Find the appointment
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            req.flash('error', 'Appointment not found.');
            return res.redirect('/patient-dashboard');
        }

        // Delete the appointment
        await Appointment.findByIdAndDelete(appointmentId);

        // Update the timeschedule status to "start"
        await TimeSchedule.findOneAndUpdate(
            { doctor: appointment.doctor, date: appointment.date },
            { status: "start" }
        );

        req.flash('success', 'Appointment successfully canceled.');
        res.redirect('/patient-dashboard'); // Redirect to dashboard or any other appropriate page
    } catch (error) {
        console.error("Error canceling appointment:", error);
        req.flash('error', 'An error occurred while canceling the appointment.');
        res.redirect('/patient-dashboard');
    }
});

module.exports = router;  