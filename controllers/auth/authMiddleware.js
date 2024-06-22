const express = require('express');
const {Admin,Doctor} = require('../../models/adminModel');
const {Patient} = require('../../models/patientModel')
const app = express();

// const isAuth = async (req, res, next) => {
//     if (req.session.isAuth === true) {
//         let userEmail;

//         try {
//             // Check if the email belongs to an admin
//             const admin = await Admin.findOne({ email: req.session.email });
//             if (admin) {
//                 userEmail = admin.email; // Store admin's email
//             }

//             // Check if the email belongs to a doctor
//             const doctor = await Doctor.findOne({ email: req.session.email });
//             if (doctor) {
//                 userEmail = doctor.email; // Store doctor's email
//             }

//             // Check if the email belongs to a patient
//             const patient = await Patient.findOne({ email: req.session.email });
//             if (patient) {
//                 userEmail = patient.email; // Store patient's email
//             }

//             if (userEmail) {
//                 req.session.email = userEmail; // Store the email in the session
//                 next();
//             } else {
//                 // If user email not found in any collection, redirect to login
//                 res.redirect('/login');
//             }
//         } catch (error) {
//             // Handle any errors that might occur during database queries
//             console.error('Error in isAuth middleware:', error);
//             res.status(500).send('Internal Server Error');
//         }
//     } else {
//         // If user is not authenticated, redirect to login
//         res.redirect('/login');
//     }
// };

// const isAdmin = async (req, res, next) => {
//     if (req.session.isAdmin === true) {
//         let userEmail;

//         try {
//             // Check if the email belongs to an admin
//             const admin = await Admin.findOne({ email: req.session.email });
//             if (admin) {
//                 userEmail = admin.email; // Store admin's email
//             }

//             if (userEmail) {
//                 req.session.email = userEmail; // Store the email in the session
//                 next();
//             } else {
//                 // If user email not found in any collection, redirect to login
//                 res.redirect('/login');
//             }
//         } catch (error) {
//             // Handle any errors that might occur during database queries
//             console.error('Error in isAuth middleware:', error);
//             res.status(500).send('Internal Server Error');
//         }
//     } else {
//         // If user is not authenticated, redirect to login
//         res.redirect('/login');
//     }
// };

// const isDoctor = async (req, res, next) => {
//     if (req.session.isDoctor === true) {
//         let userEmail;

//         try {
//             // Check if the email belongs to a doctor
//             const doctor = await Doctor.findOne({ email: req.session.email });
//             if (doctor) {
//                 userEmail = doctor.email; // Store doctor's email
//             }
        
//             if (userEmail) {
//                 req.session.email = userEmail; // Store the email in the session
//                 next();
//             } else {
//                 // If user email not found in any collection, redirect to login
//                 res.redirect('/login');
//             }
//         } catch (error) {
//             // Handle any errors that might occur during database queries
//             console.error('Error in isAuth middleware:', error);
//             res.status(500).send('Internal Server Error');
//         }
//     } else {
//         // If user is not authenticated, redirect to login
//         res.redirect('/login');
//     }
// };

// const isPatient = async (req, res, next) => {
//     if (req.session.isPatient === true) {
//         let userEmail;

//         try {
//             // Check if the email belongs to a patient
//             const patient = await Patient.findOne({ email: req.session.email });
//             if (patient) {
//                 userEmail = patient.email; // Store patient's email
//             }

//             if (userEmail) {
//                 req.session.email = userEmail; // Store the email in the session
//                 next();
//             } else {
//                 // If user email not found in any collection, redirect to login
//                 res.redirect('/login');
//             }
//         } catch (error) {
//             // Handle any errors that might occur during database queries
//             console.error('Error in isAuth middleware:', error);
//             res.status(500).send('Internal Server Error');
//         }
//     } else {
//         // If user is not authenticated, redirect to login
//         res.redirect('/login');
//     }
// };

const isAuth = (req, res, next) => {
    if (req.session.userType) {
        // User is authenticated, continue to the next middleware
        next();
    } else {
        // If user is not authenticated, redirect to login
        res.redirect('/login');
    }
};

// Example middleware for admin routes
const isAdmin = (req, res, next) => {
    if (req.session.userType === 'admin') {
        next(); // User is admin, continue
    } else {
        res.redirect('/login'); // Redirect to login if not admin
    }
};

// Similar middleware for patient and doctor routes
const isPatient = (req, res, next) => {
    if (req.session.userType === 'patient') {
        next(); // User is patient, continue
    } else {
        res.redirect('/login'); // Redirect to login if not patient
    }
};

const isDoctor = (req, res, next) => {
    if (req.session.userType === 'doctor') {
        next(); // User is doctor, continue
    } else {
        res.redirect('/login'); // Redirect to login if not doctor
    }
};

const getUserInfo = async (req, res, next) => {
    try {
        const email = req.session.email;
        if (email) {
            let user;
            // Check if the email belongs to an admin
            user = await Admin.findOne({ email });
            if (!user) {
                // Check if the email belongs to a doctor
                user = await Doctor.findOne({ email });
            }
            if (!user) {
                // Check if the email belongs to a patient
                user = await Patient.findOne({ email });
            }
            if (user) {
                req.user = user; // Attach user information to req.user
            }
        }
        next();
    } catch (error) {
        console.error('Error fetching user info:', error);
        res.status(500).send('Internal Server Error');
    }
};

app.use(isAuth,isAdmin,isDoctor,isPatient);
app.use(getUserInfo);
module.exports = {isPatient,isDoctor,isAdmin,getUserInfo};