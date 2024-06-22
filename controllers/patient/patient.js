const bcrypt = require('bcrypt');
const {Patient,Appointment} = require('../../models/patientModel');
const {Admin,Doctor} = require('../../models/adminModel');
const multer = require('multer');
const fs = require('fs');
const transporter  = require('../mail');
const { TimeSchedule } = require('../../models/doctorModel');

//Registeration patient
const registerPatient = async (req, res) => {
    const { email, password, confirmPassword } = req.body;

    // Check if passwords match
    if (password !== confirmPassword) {
        req.flash('error', 'Passwords do not match');
        return res.redirect('/register');
    }

    try {
        // Check if the email already exists in any of the collections
        const existingPatient = await Patient.findOne({ email });
        const existingDoctor = await Doctor.findOne({ email });
        const existingAdmin = await Admin.findOne({ email });

        if (existingPatient || existingDoctor || existingAdmin) {
            req.flash('error', 'Email already in use');
            return res.redirect('/register');
        }

        // Generate a salt with 10 rounds
        const salt = await bcrypt.genSalt(10);
        // Hash the password with the generated salt
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new patient instance with email and hashed password
        const newPatient = new Patient({
            email: email,
            password: hashedPassword
        });

        // Save the new patient to the database
        await newPatient.save();

        // Send a success response with a message
        req.flash('success', 'Registered successfully');
        res.redirect('/login');
    } catch (error) {
        // Handle other errors
        console.error('Error registering patient:', error);
        req.flash('error', 'Internal Server Error');
        res.redirect('/register');
    }
};

// Set up Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Set the destination folder where the uploaded image will be saved
        cb(null, './uploads/patient');
    },
    filename: (req, file, cb) => {
        // Set the filename to be the current timestamp with the original file extension
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Set up Multer upload configuration
const upload = multer({ storage: storage });

const savePatientInfo = async (req, res) => {
    try {
        const { firstName, lastName, dob, bloodGroup, mobile, address, pincode, oldImage,gender } = req.body;

        // Retrieve email ID from the session
        const email = req.session.email;

        // Check if a patient with the provided email already exists
        let patient = await Patient.findOne({ email });

        if (patient) {
            // Update existing patient's information
            patient.firstName = firstName;
            patient.lastName = lastName;
            patient.dob = dob;
            patient.bloodGroup = bloodGroup;
            patient.mobile = mobile;
            patient.address = address;
            patient.pincode = pincode;
            patient.gender = gender;

            // Set the image path to the new uploaded image if available, otherwise use the existing image path
            if (req.file) {
                // Delete the old image file if it exists
                if (oldImage) {
                    fs.unlinkSync(oldImage);
                }
                patient.image = req.file.path;
            } else {
                // If no new image uploaded, use the existing image path or set it to null if not provided
                patient.image = oldImage || null;
            }

            // Save the updated patient information to the database
            await patient.save();

            // Flash a success message
            req.flash('success', 'Profile updated successfully');
             // Redirect back to the profile settings page
            res.redirect('/profile-settings');

        } else {
            // Handle case where patient is not found
            req.flash('error', 'Patient not found');
        }

    } catch (error) {
        console.error('Error saving patient information:', error);
        req.flash('error', 'Internal Server Error');
        res.status(500).send('Internal Server Error');
    }
};

const changePasswordPatient = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const email = req.session.email;

        // Retrieve the patient from the database based on the email
        const patient = await Patient.findOne({ email });

        // Check if the patient exists
        if (!patient) {
            req.flash('error', 'Patient not found');
            return res.redirect('/patient-change-password');
        }

        // Validate the old password
        const isPasswordValid = await bcrypt.compare(oldPassword, patient.password);
        if (!isPasswordValid) {
            req.flash('error', 'Incorrect old password');
            return res.redirect('/patient-change-password');
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the patient's password
        patient.password = hashedPassword;
        await patient.save();

        // Send a flash message indicating success
        req.flash('success', 'Password changed successfully');

        // Optionally, send an email to the patient
        await transporter.sendMail({
            from: 'sangramonlinework99@gmail.com',
            to: patient.email,
            subject: 'Password Change Confirmation',
            html: `
                <p>Dear ${patient.firstName || patient.email},</p>
                <p>We are writing to inform you that your password has been successfully changed.</p>
                <p>If you did not make this change, please contact us immediately.</p>
                <p>For any queries or assistance, feel free to reach out to us (95794 80968 / 93703 20066)</p>
                <p>Thank you for your attention to this matter.</p>
                <p>Best regards,</p>
                <p>Team OPD Management System</p>
                <p>Sangram Patil / Krushna Zarekar</p>
            `
        });

        // Redirect to profile settings page with success message
        res.redirect('/patient-change-password');
    } catch (error) {
        console.error('Error changing password:', error);
        req.flash('error', 'Internal Server Error');
        res.redirect('/patient-change-password');
    }
};

const saveAppointment = async (req, res) => {
    try {
        const { patientId, doctorId, startTime, endTime, date } = req.body;

        const bookingDate = new Date();

        const doctor = await Doctor.findById(doctorId);
        const patient = await Patient.findById(patientId);

        const appointmentData = { startTime, endTime }

        // Create the appointment
        const appointment = new Appointment({
            patient: patientId,
            doctor: doctorId, 
            startTime,
            endTime,
            date,
            bookingDate: bookingDate,
        });


        // Save the appointment to the database
        await appointment.save();

        const parts = date.split('-');
	    const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;

        await transporter.sendMail({
            from: 'sangramonlinework99@gmail.com',
            to: patient.email,
            subject: 'Appointment Confirmation',
            html: `
                <p>Dear ${patient.firstName || patient.email},</p>
                <p>We are delighted to inform you that your appointment has been successfully booked with ${doctor.name} on ${formattedDate } at ${appointmentData.startTime} to ${appointmentData.endTime}</p>
                <p>For any queries or assistance, feel free to reach out to us (95794 80968 / 93703 20066)</p>
                <p>Thank you for choosing our services. We look forward to seeing you soon.</p>
                <p>Best regards,</p>
                <p>Team OPD Management System</p>
                <p>Sangram Patil / Krushna Zarekar</p>
            `
        });

        const slot = await TimeSchedule.findOne({doctor : doctorId, startTime:appointmentData.startTime, endTime:appointmentData.endTime, date:date})

        if(slot){
             // Update the status to 'book'
            slot.status = 'book';

            // Save the updated slot
            await slot.save();
        }

        res.render('../views/booking-success', {doctor,patient,appointmentData,date})

        // res.status(201).json({ message: 'Appointment created successfully', appointment });
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {registerPatient,savePatientInfo,upload,changePasswordPatient,saveAppointment};