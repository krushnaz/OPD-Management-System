const {Admin,Speciality,Doctor} = require('../models/adminModel');
const {Patient} = require('../models/patientModel');
const bcrypt = require('bcrypt');
const transporter  = require('./mail');
const multer = require('multer');
const fs = require('fs');
const {TimeSchedule} = require('../models/doctorModel')
// const deleteAssociatedDoctors = require('../models/adminModel');

// Middleware function to delete associated doctors
const deleteAssociatedDoctors = async (specialityId) => {
    try {
        // Find and delete doctors associated with the given specialityId
        await Doctor.deleteMany({ specialityId: specialityId });
    } catch (error) {
        console.error('Error deleting associated doctors:', error);
        throw error; // Re-throw the error to handle it in the calling function
    }
};

// Define an async function to create the new admin
const createAdmin = async () => {
    try {
        // Hash the password asynchronously using bcrypt
        const hashedPassword = await bcrypt.hash('000', 10);
        function getDateWithoutTime(dateStr) {
            const date = new Date(dateStr);
            date.setHours(0, 0, 0, 0); // Set hours, minutes, seconds, milliseconds to zero
            return date;
          }
          
          const dob = getDateWithoutTime("<2002-11-09>");
        // Create the new admin object with the hashed password
        const newAdmin = new Admin({
            firstName: 'Kunal',
            lastName: 'Yadav',
            email: 'kunalyadav@gmail.com',
            password: hashedPassword,
            dob : getDateWithoutTime("<2002-11-09>"),
            mobile: '1234567890',
            image: 'profile.jpg'
        });

        // Save the document to the database
        const admin = await newAdmin.save();

        // Log the created admin
        console.log('Admin created:', admin);
    } catch (error) {
        // Handle errors
        console.error('Error creating admin:', error);
    }
};

// Call the async function to create the new admin
// createAdmin();

// Controller function to update admin information
const updateAdmin = async (req, res) => {
    try {
        // Fetch the admin data from the database
        let admin = await Admin.findOne({});
        
        // Update admin information based on the form data
        admin.firstName = req.body.firstName;
        admin.lastName = req.body.lastName;
        admin.email = req.body.email;
        admin.dob = req.body.dob;
        admin.mobile = req.body.mobile;
        
        // Save the updated admin data to the database
        admin = await admin.save();
        
        // Set flash message
        req.flash('success', 'Profile updated');

        // Redirect to the profile page
        res.redirect('/profile');
    } catch (error) {
        // Handle errors
        console.error('Error updating admin data:', error);
        res.status(500).send('Internal Server Error');
    }
};

//controller to change the password
const changePasswordAdmin = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    try {
        // Retrieve the admin data from the database
        const admin = await Admin.findOne({});

        // Check if the admin exists
        if (!admin) {
            req.flash('error', 'Admin not found');
            return res.redirect('/profile'); // Redirect to profile page with error message
        }

        // Compare the old password provided by the user with the hashed password stored in the database
        const passwordMatch = await bcrypt.compare(oldPassword, admin.password);

        // If passwords don't match, return an error
        if (!passwordMatch) {
            req.flash('error', 'Invalid old password');
            return res.redirect('/profile'); // Redirect to profile page with error message
        }

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update the admin's password with the new hashed password
        admin.password = hashedNewPassword;

        // Save the updated admin data to the database
        await admin.save();

        // Password successfully changed
        req.flash('success', 'Password changed successfully');

        // Retrieve admin's email address from the database
        const adminEmail = admin.email;
        const adminName = admin.firstName;
        // Send email notification
        sendPasswordChangeEmail(adminEmail,adminName);

        return res.redirect('/profile'); // Redirect to profile page with success message
    } catch (error) {
        console.error('Error changing password:', error);
        req.flash('error', 'Internal Server Error');
        return res.redirect('/profile'); // Redirect to profile page with error message
    }
};

// Function to send email notification
const sendPasswordChangeEmail = (adminEmail,adminName) => {
    // Construct email message
    const mailOptions = {
        from: 'sangramonlinework99@gmail.com',
        to: adminEmail,
        subject: 'Password Changed Successfully for OPD Management System',
        html: `
            <p>Hello ${adminName},</p>
            <p>We're writing to inform you that your password has been successfully changed.</p>
            <p>If you did not make this change, please contact us immediately.</p>
            <p>For any queries or assistance, feel free to reach out to us.</p>
            <p>Warm regards,</p>
            <p>Sangram Patil and Krushna Zarekar</p>
            <p>95794 80968 / 93703 20066</p>
        `
    };

    // Send email using transporter from main.js
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
};

// Set up Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Set the destination folder where the uploaded image will be saved
        cb(null, './uploads');
    },
    filename: (req, file, cb) => {
        // Set the filename to be the current timestamp with the original file extension
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Set up Multer upload configuration
const upload = multer({ storage: storage });

// Controller function to handle the POST request for adding a new speciality
const addSpeciality = async (req, res) => {
    try {
        // Extract speciality name from request body
        const { speciality } = req.body;

        // Check if the speciality name already exists
        const existingSpeciality = await Speciality.findOne({ name: speciality });
        if (existingSpeciality) {
            req.flash('error', 'Speciality name must be unique');
            return res.redirect('/specialities');
        }

        // Create a new speciality object with the name and file path
        const newSpeciality = new Speciality({
            name: speciality,
            image: req.file.path // Multer middleware will store the uploaded image's path in req.file.path
        });

        // Save the new speciality to the database
        const savedSpeciality = await newSpeciality.save();

        req.flash('success', 'Speciality Added');

        // Redirect to the specialities page
        res.redirect('/specialities');
    } catch (error) {
        // Handle errors
        console.error('Error adding speciality:', error);
        req.flash('error', 'Internal Server Error');
        res.redirect('/specialities');
    }
};

const updateSpeciality = async (req, res) => {
    const id = req.params.id;
    let newImage = "";

    // Check if a new image was uploaded
    if (req.file) {
        newImage = req.file.filename;
        try {
            // Remove old image if exists
            const speciality = await Speciality.findById(id);
            if (speciality.image) {
                fs.unlinkSync('./' + speciality.image);
            }
        } catch (err) {
            console.log(err);
        }
    } else {
        // No new image uploaded, keep the old one
        newImage = req.body.old_image;
    }

    try {
        // Update the speciality with new data
        await Speciality.findByIdAndUpdate(id, { 
            name: req.body.name,
            image: req.file.path
        });
        req.flash('success', 'Speciality updated successfully');
        res.redirect('/specialities');
    } catch (err) {
        req.flash('error', 'Error updating speciality');
        res.redirect('/specialities');
    }
};

// Delete speciality and associated doctors
const deleteSpeciality = async (req, res) => {
    const id = req.params.id;

    try {
        // Find the speciality by ID
        const speciality = await Speciality.findById(id);

        // If the speciality exists
        if (speciality) {
            // Use the middleware to delete associated doctors
            await deleteAssociatedDoctors(id);

            // Remove the speciality image file if it exists
            if (speciality.image) {
                fs.unlinkSync('./' + speciality.image);
            }

            // Remove the speciality
            await speciality.deleteOne(); // Use deleteOne method instead of remove

            // Send success flash message
            req.flash('success', 'Speciality and associated doctors deleted successfully');
        } else {
            // Speciality not found
            req.flash('error', 'Speciality not found');
        }

        // Redirect to specialities page
        res.redirect('/specialities');
    } catch (error) {
        // Handle errors
        console.error('Error deleting speciality:', error);
        req.flash('error', 'Error deleting speciality');

        // Redirect to specialities page
        res.redirect('/specialities');
    }
};

const addDoctor = async (req, res) => {
    try {
        // Extract fields from the request body
        const { name, specialityId, mobile, email, password } = req.body;

        // Check if the email already exists in any of the Admin, Patient, and Doctor collections
        const existingAdmin = await Admin.findOne({ email: email });
        const existingPatient = await Patient.findOne({ email: email });
        const existingDoctor = await Doctor.findOne({ email: email });

        if (existingAdmin || existingPatient || existingDoctor) {
            // If the email already exists in any collection, send a flash message and redirect
            req.flash('error', 'Email already exists. Please use a different email.');
            return res.redirect('/doctor-list');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new instance of the Doctor model with hashed password
        const newDoctor = new Doctor({
            name: name,
            mobile: mobile,
            email: email,
            password: hashedPassword,
            specialityId: specialityId
        });

        // Save the new doctor to the database
        const savedDoctor = await newDoctor.save();

        // Set flash message
        req.flash('success', 'Doctor added successfully');

        // Redirect to a page where the alert will be displayed
        res.redirect('/doctor-list');
    } catch (error) {
        // Handle errors
        console.error('Error adding doctor:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const updateDoctor = async (req, res) => {
    try {
        // Extract fields from the request body
        const { name, specialityId, mobile, email, password } = req.body;

        // Retrieve the doctor's ID from the URL parameters
        const doctorId = req.params.id;

        // Check if the provided email already exists for another doctor
        const existingDoctor = await Doctor.findOne({ email: email, _id: { $ne: doctorId } });
        if (existingDoctor) {
            // If email already exists for another doctor, send an error flash message
            req.flash('error', 'Email already exists. Please choose a different email.');
            return res.redirect('/doctor-list');
        }

        // Hash the password with salt value 10
        const hashedPassword = await bcrypt.hash(password, 10);

        // Find the doctor by ID and update their information
        const updatedDoctor = await Doctor.findByIdAndUpdate(doctorId, {
            name: name,
            mobile: mobile,
            email: email,
            password: hashedPassword, // Update with hashed password
            specialityId: specialityId
        }, { new: true });

        // Send a success flash message
        req.flash('success', 'Doctor updated successfully');
        res.redirect('/doctor-list');
    } catch (error) {
        // Handle errors
        console.error('Error updating doctor:', error);
        req.flash('error', 'Error updating doctor');
        res.redirect('/doctor-list');
    }
};

const deleteDoctor = async (req, res) => {
    try {
        const doctorId = req.params.id;
        
        // Check if the doctor exists before attempting to delete it
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            throw new Error('Doctor not found');
        }

        // Delete the time schedules associated with the doctor
        await TimeSchedule.deleteMany({ doctor: doctorId });

        // Delete the doctor from the database
        await Doctor.findByIdAndDelete(doctorId);

        // Set a success flash message
        req.flash('success', 'Doctor and associated schedules deleted successfully');

        // Redirect to a page where the alert will be displayed
        res.redirect('/doctor-list');
    } catch (error) {
        // Handle errors
        console.error('Error deleting doctor:', error);

        // Set an error flash message
        req.flash('error', 'Error deleting doctor');

        // Redirect to a page where the alert will be displayed
        res.redirect('/doctor-list');
    }
};

module.exports = { updateAdmin, changePasswordAdmin,addSpeciality,upload,deleteSpeciality ,addDoctor,updateDoctor,deleteDoctor,updateSpeciality};