const express = require('express');
const router = express.Router();
const {Speciality,Doctor} = require('../../models/adminModel');
const {TimeSchedule} = require('../../models/doctorModel')
const {login} = require('../../controllers/auth/auth');

//Rendering Home Page
router.get('/', async (req, res) => {
    try {
        // Get the current system date
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to zero for comparison

        // Add logic to fetch specialities from the database
        // For example:
        const specialities = await Speciality.find();

        // Fetch distinct doctor IDs from the TimeSchedule collection based on the status 'start'
        const distinctDoctorIds = await TimeSchedule.distinct('doctor', { status: 'start', date: { $gte: currentDate } });

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

        // Render the specialities page and pass specialities and success message to it
        res.render('index', { specialities, doctors: doctorsWithSpecialty });
    } catch (error) {
        // Handle errors
        console.error('Error fetching specialities:', error);
        res.status(500).send('Internal Server Error');
    }
});

//Rendering login page
router.get('/login', (req, res) => {
    
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const errorMessages = req.flash('error');
    const successMessages = req.flash('success');

    res.render('login', { error: errorMessages, success: successMessages });
});


//Rendering register
router.get('/register', (req, res) => {
    res.render('register', { error: req.flash('error') });
});

//Randering the forgot password
router.get('/forgot-password', (req, res) => {
    res.render('forgot-password')
});

//Checking the login
router.post('/login-check',login);

//Registering the user
router.post('/register-user',(req,res)=>{
    
})

//logout
router.get('/logout',(req,res)=>{
    req.session.destroy();
    res.redirect('/login')
})


module.exports = router;