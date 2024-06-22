
const bcrypt = require('bcrypt');
const {Patient} = require('../../models/patientModel');
const {Admin,Doctor} = require('../../models/adminModel');

//login
const login = async (req, res) => {
    const { email, password } = req.body;

    // Check if the user exists in any of the user types
    const admin = await Admin.findOne({ email });
    const patient = await Patient.findOne({ email });
    const doctor = await Doctor.findOne({ email });

    if (admin) {
        // Compare the password with the hashed password stored in the database
        const isMatch = await bcrypt.compare(password, admin.password);
        if (isMatch) {
            // Set user email and type in session
            req.session.userType = 'admin';
            req.session.email = email;
            res.redirect('/admin-dashboard');
            return; // Return to avoid executing further code
        }
    } else if (patient) {
        const isMatch = await bcrypt.compare(password, patient.password);
        if (isMatch) {
            // Set user email and type in session
            req.session.userType = 'patient';
            req.session.email = email;
            res.redirect('/patient-dashboard');
            return; // Return to avoid executing further code
        }
    } else if (doctor) {
        const isMatch = await bcrypt.compare(password, doctor.password);
        if (isMatch) {
            // Set user email and type in session
            req.session.userType = 'doctor';
            req.session.email = email;
            res.redirect('/doctor-dashboard');
            return; // Return to avoid executing further code
        }
    }

    // If user is not found or password is incorrect, redirect to login
    req.flash('error', 'Invalid email or password');
    res.redirect('/login');
};

module.exports = {login};