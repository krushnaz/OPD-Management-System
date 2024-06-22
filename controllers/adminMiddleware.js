const {Admin,Speciality,Doctor} = require('../models/adminModel');
const mongoose = require('mongoose');

const adminMiddleware = async (req, res, next) => {
    try {
        // Fetch the admin data from the database
        const admin = await Admin.findOne({});  
         
        // Pass admin data to all views
        res.locals.admin = admin;

        // Initialize msg to req.query.msg or an empty string
        const msg = req.query.msg || ''; 
        
        // Pass msg to all views
        res.locals.msg = msg;

        next();
    } catch (err) {
        // Forward the error to Express's error handling middleware
        next(err);
    }
};

const specialityMiddleware = async (req, res, next) => {
    try {
        // Fetch specialities from the database
        const specialities = await Speciality.find({}, 'name');

        // Make specialities available in the request object
        req.specialities = specialities;

        next(); // Call next middleware
    } catch (error) {
        // Handle errors
        console.error('Error fetching specialities:', error);
        next(error); // Forward error to Express's error handling middleware
    }
};

const doctorMiddleware = async (req, res, next) => {
    try {
        // Fetch doctors from the database
        const doctors = await Doctor.find({}).populate('specialityId');

        // Make doctors available in the request object
        req.doctors = doctors;

        next(); // Call next middleware
    } catch (error) {
        // Handle errors
        console.error('Error fetching doctors:', error);
        next(error); // Forward error to Express's error handling middleware
    }
};

module.exports = {adminMiddleware,specialityMiddleware,doctorMiddleware};
