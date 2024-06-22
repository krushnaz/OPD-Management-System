const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    dob: {
        type: Date,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    image: {
        type : String,
    },
    
});

const specialitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    image: {
        type: String,
        required: true
    },
});

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    gender: {
        type: String
    },
    dob: {
        type: String
    },
    biography: {
        type: String
    },
    education: [{
        degree: String,
        institute: String,
        yearOfCompletion: Number
    }],
    experience: [{
        from: String,
        to: String,
        designation: String
    }],
    specialityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Speciality', // Reference to the Speciality model
        required: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    image: {
        type : String,
    }
});

// Create the Doctor model
const Doctor = mongoose.model('Doctor', doctorSchema);
const Speciality = mongoose.model('Speciality', specialitySchema);
const Admin = mongoose.model('Admin', adminSchema);

module.exports = {Admin, Speciality,Doctor};