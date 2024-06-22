const mongoose = require('mongoose');
const cron = require('node-cron');

const timeScheduleSchema = new mongoose.Schema({
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    slotDuration: {
        type: Number, // Duration in minutes
        required: true
    },
    startTime: {
        type: String, // Assuming time in HH:mm format
        required: true
    },
    endTime: {
        type: String, // Assuming time in HH:mm format
        required: true
    },
    status: {
        type: String,
        enum: ['start', 'close', 'book'], // Possible values for status
        default: 'start', // Default status is 'Start'
        required: true,
    }
});

timeScheduleSchema.methods.updateStatus = function () {
    // Get the current date
    const currentDate = new Date();

    // Clone the date of the schedule
    const scheduleDate = new Date(this.date);

    // Check if the current date is after or equal to the schedule date
    if (currentDate >= scheduleDate) {
        // If the current date is after or equal to the schedule date, set status to 'Close'
        this.status = 'close';
    } else {
        // Otherwise, set status to 'Start'
        this.status = 'start';
    }
};

const TimeSchedule = mongoose.model('TimeSchedule', timeScheduleSchema);

// Define a cron job to update statuses every day at midnight (00:00)
cron.schedule('0 0 * * *', async () => {
    try {
        // Find all TimeSchedule documents
        const schedules = await TimeSchedule.find();

        // Update status for each document
        schedules.forEach(async (schedule) => {
            schedule.updateStatus(); // Call the updateStatus method
            await schedule.save(); // Save the updated document
        });

        console.log('Statuses updated successfully.');
    } catch (error) {
        console.error('Error updating statuses:', error);
    }
});

module.exports = { TimeSchedule };


// 1. Prescription Schema
