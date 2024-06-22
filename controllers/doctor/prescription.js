// Assuming you have a Prescription model that represents your prescription items
const Prescription = require('../../models/prescriptionModel');

// Controller function to handle fetching prescription items
exports.getPrescriptionItems = async (req, res) => {
    try {
        // Fetch prescription items from the database
        const prescriptionItems = await Prescription.find({}); // Adjust query as per your schema

        // Render the edit-prescription.ejs template and pass the prescriptionItems data
        res.render('edit-prescription', { prescriptionItems });
    } catch (error) {
        // Handle any errors that occur during the process
        console.error('Error fetching prescription items:', error);
        // Render an error page or return an error response
        res.status(500).send('Internal Server Error');
    }
};
