const express = require('express');
const router = express.Router();
const {Admin,Speciality,Doctor} = require('../../models/adminModel');
const {isAdmin} = require('../../controllers/auth/authMiddleware');
const {Patient} = require('../../models/patientModel');
const {Appointment} = require('../../models/patientModel')
const { updateAdmin,changePasswordAdmin,addSpeciality,upload,deleteSpeciality, addDoctor,updateDoctor,deleteDoctor, updateSpeciality } = require('../../controllers/admin');

router.get('/admin-dashboard', isAdmin, async (req, res) => {
    try {
        // Get total counts
        const totalDoctorsCount = await Doctor.countDocuments();
        const totalPatientsCount = await Patient.countDocuments();
        const totalAppointmentsCount = await Appointment.countDocuments();

        // Get doctor list with populated speciality
        const doctors = await Doctor.find().populate('specialityId');

        // Get patient list
        const patients = await Patient.find();

        // Render the admin dashboard page with the data
        res.render('../views/admin/index', {
            totalDoctorsCount,
            totalPatientsCount,
            totalAppointmentsCount,
            doctors,
            patients
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/patient-list', isAdmin, async(req, res) => {
    try{
        const patients = await Patient.find()
        const success = req.flash('success');
        const error = req.flash('error');
        res.render('../views/admin/patient-list',{
            patients,success, error
        })
    }
    catch (error){
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }    
});

router.get('/appointment-list', isAdmin, async (req, res) => {
    try {
        // Fetch appointment details with patient and doctor information, populating the 'doctor' field with doctor details and 'patient' field with patient details
        const appointments = await Appointment.find().populate({
            path: 'doctor',
            populate: {
                path: 'specialityId', // Assuming 'specialityId' is the field containing the reference to the Speciality model
                model: 'Speciality' // Name of the Speciality model
            }
        }).populate('patient');

        // Render the appointment list page with appointment details
        res.render('../views/admin/appointment-list', { appointments });
    } catch (error) {
        console.error('Error fetching appointment data:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/specialities', isAdmin, async (req, res) => {
    try {
        // Retrieve flash message
        const successMessage = req.flash('success')[0]; // Get the first message

        // Add logic to fetch specialities from the database
        // For example:
        const specialities = await Speciality.find();

        // Render the specialities page and pass specialities and success message to it
        res.render('../views/admin/specialities', { specialities, successMessage });
    } catch (error) {
        // Handle errors
        console.error('Error fetching specialities:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/doctor-list', isAdmin, async (req, res) => {
    try {
        // Access specialities from the request object
        const specialities = req.specialities;
        const doctors = req.doctors;

        // Get the flash messages
        const error = req.flash('error');
        const success = req.flash('success');

        // Render your view with specialities available
        res.render('../views/admin/doctor-list', { specialities, doctors, error: error.length > 0 ? error : null, success: success.length > 0 ? success : null });
    } catch (error) {
        // Handle errors
        console.error('Error fetching data:', error);
        req.flash('error', 'Internal Server Error');
        res.redirect('/doctor-list');
    }
});

router.get('/profile', isAdmin, async (req, res) => {
    try {
        // Retrieve flash message
        const msg = req.flash('success')[0]; // Get the first message

        // Find the admin data in the database
        const admin = await Admin.findOne();

        // Check if admin exists
        if (!admin) {
            // If admin is not found, handle the error
            return res.status(404).send('Admin not found');
        }

        // Render the profile page and pass admin data and message to it
        res.render('../views/admin/profile', { admin, msg });
    } catch (error) {
        // Handle errors
        console.error('Error fetching admin data:', error);
        res.status(500).send('Internal Server Error');
    }
});

//Update admin info
router.post('/update-admin', isAdmin, updateAdmin);

//Change password
router.post('/change-admin-password', isAdmin, changePasswordAdmin);

//Adding Speciality
router.post('/add-speciality',isAdmin, upload.single('image'), addSpeciality);

//delete speciality
router.post('/delete-speciality/:id', isAdmin, deleteSpeciality);

//Update Speciality
router.post('/update-speciality/:id',isAdmin, upload.single('image'), updateSpeciality);

//Adding doctor
router.post('/add-doctor', isAdmin, addDoctor);

//Update doctor
router.post('/update-doctor/:id', isAdmin, updateDoctor);

//Delete doctor
router.post('/delete-doctor/:id', isAdmin, deleteDoctor);

router.post('/delete-patient/:id', async (req, res) => {
    try {
        const patientId = req.params.id;
        const deletedPatient = await Patient.findByIdAndDelete(patientId);

        if (!deletedPatient) {
            req.flash('error', 'Patient not found');
            return res.redirect('/patient-list');
        }

        req.flash('success', 'Patient deleted successfully');
        res.redirect('/patient-list');
    } catch (error) {
        req.flash('error', error.message);
        res.redirect('/patient-list');
    }
});




module.exports = router;