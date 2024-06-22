const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    dob: {
        type: String,
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
    bloodGroup: {
        type: String,
    },
    mobile: {
        type: String,
        unique: true,
        
    },
    address: {
        type: String,
    },
    pincode: {
        type: String,
    },
    image: {
        type: String,
    },
    gender: {
        type: String,
    }
});

const appointmentSchema = new mongoose.Schema({
    patient: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Patient', 
        required: true, 
    },
    doctor: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Doctor', 
        required: true, 
    },
    startTime: { 
        type: String, 
        required: true, 
    },
    endTime: { 
        type: String, 
        required: true, 
    },
    date: { 
        type: Date, 
        required: true,
    },
    bookingDate: {
        type : Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['waiting for doctor confirmation', 'cancel by doctor', 'accept by doctor'],
        default: 'waiting for doctor confirmation',
        required: true,
    }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
const Patient = mongoose.model('Patient', patientSchema);

module.exports = {Patient, Appointment};
