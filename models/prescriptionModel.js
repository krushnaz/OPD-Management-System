const mongoose = require('mongoose');

// Define Prescription Schema
const prescriptionSchema = new mongoose.Schema({
    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true
    },
    doctorName: {
        type: String,
        required: true
    },
    medicines: {
        type: String,
        required: true
    },
    notes: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});


// Define the schema for invoices
// const invoiceSchema = new mongoose.Schema({
//     appointment: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Appointment',
//         required: true
//     },
//     doctorName: {
//         type: String,
//         required: true
//     },
//     amount: {
//         type: Number,
//         required: false
//     },
//     notes: {
//         type: String
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now
//     }
// });

// Create Prescription model from schema
const Prescription = mongoose.model('Prescription', prescriptionSchema);
module.exports = Prescription;

// const Invoice = mongoose.model('Invoice', invoiceSchema);
// module.exports = Invoice;



// Create the Invoice model


