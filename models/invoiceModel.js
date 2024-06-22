
const mongoose = require('mongoose');

// Define the schema for invoices
const invoiceSchema = new mongoose.Schema({
    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true
    },
    doctorName: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: false
    },
    notes: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
module.exports = Invoice;