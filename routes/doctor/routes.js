const express = require('express');
const router = express.Router();
const {Doctor} = require('../../models/adminModel');
const {saveDoctorInfo, saveScheduleTime,editScheduleTime,deleteSchedule,upload,changePasswordDoctor} = require('../../controllers/doctor/doctor');
const {isDoctor} = require('../../controllers/auth/authMiddleware');
const {TimeSchedule} = require('../../models/doctorModel');
const {Patient,Appointment} = require('../../models/patientModel')
const Prescription = require('../../models/prescriptionModel');
const Invoice = require('../../models/invoiceModel');



//Rendering Doctor Dashboard
router.get('/doctor-dashboard', isDoctor, async (req, res) => {
    try {
        const doctorEmail = req.session.email;

        // Find the doctor based on the email
        const doctor = await Doctor.findOne({ email: doctorEmail });

        if (!doctor) {
            req.flash('error', 'Doctor not found');
            return res.redirect('/error');
        }

        // Find appointments associated with the doctor and populate patient data
        const appointments = await Appointment.find({ doctor: doctor._id }).populate('patient');

        // Calculate total appointment count for the doctor
        const totalAppointmentsCount = appointments.length;

        // Calculate today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filter appointments for today using $gte and $lt operators
        const todayAppointments = await Appointment.find({
            doctor: doctor._id,
            date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } // Between start and end of today
        }).populate('patient');

        // Use a set to store unique patient IDs for today's appointments
        const uniquePatientIds = new Set();

        // Iterate over today's appointments and add unique patient IDs to the set
        todayAppointments.forEach(appointment => {
            if (appointment.patient) {
                uniquePatientIds.add(appointment.patient._id.toString());
            }
        });

        // Calculate today's appointment count
        const todayAppointmentsCount = todayAppointments.length;

        // Calculate total patients count by taking the size of the set
        const totalPatientsCount = uniquePatientIds.size;

        // Pass data to the rendering template
        res.render('doctor-dashboard', {
            doctor,
            totalAppointmentsCount,
            todayAppointmentsCount,
            todayAppointments,
            totalPatientsCount,
            error: req.flash('error'),
            success: req.flash('success')
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        req.flash('error', 'Internal Server Error');
        return res.redirect('/error');
    }
});

//Rendering Doctor My Patient
router.get('/my-patients', isDoctor, async (req, res) => {
    try {
        // Find the current doctor's email from the session
        const doctorEmail = req.session.email;

        // Find the doctor based on the email
        const doctor = await Doctor.findOne({ email: doctorEmail });
        if (!doctor) {
            res.status(404).json({ error: 'Doctor not found' });
            return res.redirect('login'); // Redirect to login if doctor not found
        }

        // Find appointments associated with the doctor
        const appointments = await Appointment.find({ doctor: doctor._id }).populate('patient');
        
        // Extract patient IDs from appointments
        const patientIds = appointments.map(appointment => appointment.patient);

        // Fetch patient data based on patient IDs
        const patients = await Patient.find({ _id: { $in: patientIds } });

        // Pass the doctor and patient data to the rendering template
        res.render('my-patients', { doctor, patients, error: req.flash('error'), success: req.flash('success') });
    } catch (error) {
        console.error('Error fetching patients:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

//Rendering Doctor appoinments
router.get('/appointments', isDoctor, async (req, res) => {
    try {
        // Find the doctor using the doctor's email from the session
        const doctorEmail = req.session.email;
        const doctor = await Doctor.findOne({ email: doctorEmail });
        
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        // Find appointments associated with the doctor
        const appointments = await Appointment.find({ doctor: doctor._id });

        // Extract patient IDs from the appointments
        const patientIds = appointments.map(appointment => appointment.patient);

        // Fetch patient information for each patient ID
        const patients = await Patient.find({ _id: { $in: patientIds } });

        // Map patient information to their respective appointments
        const appointmentsWithPatients = appointments.map(appointment => {
            const patient = patients.find(patient => patient._id.equals(appointment.patient));
            return { ...appointment.toObject(), patient };
        });

        // Render the appointments page with appointments and associated patient information
        res.render('appointments', { doctor, appointments: appointmentsWithPatients, error: req.flash('error'), success: req.flash('success') });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//Rendering Doctors Schedule timings 
router.get('/schedule-timings', isDoctor, async (req, res) => {
    try {
        // Find the time schedules for the current doctor (using the doctor's email from session)
        const doctorEmail = req.session.email;
        const doctor = await Doctor.findOne({ email: doctorEmail });
        if (!doctor) {
             res.status(404).json({ error: 'Doctor not found' });
             return res.redirect('login')
        }

        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        // Fetch time schedules for the doctor
        const timeSchedules = await TimeSchedule.find({ date: { $gte: currentDate },doctor: doctor._id });

        // Pass the time schedules data to your rendering template
        res.render('schedule-timings', { doctor, timeSchedules: timeSchedules , error: req.flash('error'), success: req.flash('success')});
    } catch (error) {
        console.error('Error fetching schedule timings:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

//Rendering Doctors profile settings
router.get('/doctor-profile-settings', isDoctor,  async(req, res) => {
    try {

        // Retrieve email ID from the session
        const email = req.session.email;

        // Fetch patient data from the database based on the email ID
        const doctor = await Doctor.findOne({ email });

        if (doctor) {
            // Render the profile settings page with doctor information
            res.render('doctor-profile-settings', { doctor, error: req.flash('error'), success: req.flash('success') });
        } else {
            // Handle case where patient information is not found
            res.status(404).send('Doctor not found');
        }
    } catch (error) {
        console.error('Error fetching doctor data:', error);
        res.status(500).send('Internal Server Error');
    }
});

//Rendering Doctors profile settings
router.get('/doctor-change-password', isDoctor,  async(req, res) => {
    try {
        // Find the time schedules for the current doctor (using the doctor's email from session)
        const doctorEmail = req.session.email;
        const doctor = await Doctor.findOne({ email: doctorEmail });
        if (!doctor) {
            res.status(404).json({ error: 'Doctor not found' });
            return res.redirect('login')
        }

        // Pass the time doctor data to your rendering template
        res.render('doctor-change-password', { doctor , error: req.flash('error'), success: req.flash('success')});
    } catch (error) {
        console.error('Error fetching schedule timings:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// //Rendering Prescription
// router.get('/view-prescription/:appointment_id', isDoctor, async(req, res) => {
//     try {
//         const appointmentId = req.params.appointment_id;

//         // Find the appointment with the specified ID and populate the patient and doctor fields
//         const appointment = await Appointment.findById(appointmentId)
//             .populate({
//                 path: 'doctor',
//                 populate: { path: 'specialityId' } // Populate the specialityId field of the doctor
//             })
//             .populate('patient');

//         if (!appointment) {
//             // Handle the case where the appointment is not found
//             return res.status(404).json({ error: 'Appointment not found' });
//         }

//         // If appointment is found, render the view-appointment page with appointment data
//         res.render('view-prescription', { appointment });
//     } catch (error) {
//         console.error('Error fetching appointment data:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

//Rendering Add Prescription
router.get('/add-prescription/:appointment_id', isDoctor, async(req, res) => {
    try {
        const appointmentId = req.params.appointment_id;

        // Find the appointment with the specified ID and populate the patient and doctor fields
        const appointment = await Appointment.findById(appointmentId)
            .populate({
                path: 'doctor',
                populate: { path: 'specialityId' } // Populate the specialityId field of the doctor
            })
            .populate('patient');

        if (!appointment) {
            // Handle the case where the appointment is not found
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // If appointment is found, render the view-appointment page with appointment data
        res.render('add-prescription', { appointment, error: req.flash('error'),success: req.flash('success')});
    } catch (error) {
        console.error('Error fetching appointment data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//Rendering edit Prescription
router.get('/edit-prescription/:appointment_id', isDoctor,  async(req, res) => {
    try {
        const appointmentId = req.params.appointment_id;

        // Find the appointment with the specified ID and populate the patient and doctor fields
        const appointment = await Appointment.findById(appointmentId)
            .populate({
                path: 'doctor',
                populate: { path: 'specialityId' } // Populate the specialityId field of the doctor
            })
            .populate('patient');

        if (!appointment) {
            // Handle the case where the appointment is not found
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // If appointment is found, render the view-appointment page with appointment data
        res.render('edit-prescription', {appointment, error: req.flash('error'),success: req.flash('success')} );
    } catch (error) {
        console.error('Error fetching appointment data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//Rendering view appointment
router.get('/view-appointment/:appointment_id', isDoctor, async (req, res) => {
    try {
        const appointmentId = req.params.appointment_id;

        // Find the appointment with the specified ID and populate the patient and doctor fields
        const appointment = await Appointment.findById(appointmentId)
            .populate('patient')
            .populate('doctor');

        if (!appointment) {
            // Handle the case where the appointment is not found
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // If appointment is found, render the view-appointment page with appointment data
        res.render('view-appointment', { appointment });
    } catch (error) {
        console.error('Error fetching appointment data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//Rendering view appointment
router.get('/add-invoice/:appointment_id', isDoctor, async (req, res) => {
    try {
        const appointmentId = req.params.appointment_id;

        // Find the appointment with the specified ID and populate the patient and doctor fields
        const appointment = await Appointment.findById(appointmentId)
            .populate('patient')
            .populate('doctor');

        if (!appointment) {
            // Handle the case where the appointment is not found
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // If appointment is found, render the view-appointment page with appointment data
        res.render('add-invoice', { appointment });
    } catch (error) {
        console.error('Error fetching appointment data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}); 

router.get('/view-invoice/:appointment_id',isDoctor, async(req,res)=>{
    try {
        const appointmentId = req.params.appointment_id;

        // Find the appointment with the specified ID and populate the patient and doctor fields
        const appointment = await Appointment.findById(appointmentId)
            .populate('patient')
            .populate('doctor');

        if (!appointment) {
            // Handle the case where the appointment is not found
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // If appointment is found, render the view-appointment page with appointment data
        res.render('view-invoice', { appointment });
    } catch (error) {
        console.error('Error fetching appointment data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

//Changing doctor password
router.post('/change-doctor-password',  isDoctor, changePasswordDoctor);

//Updating doctor profile
router.post('/saveDoctorInfo', isDoctor,  upload.single('image'), saveDoctorInfo);

//Schedule doctor time
router.post('/schedule-time', isDoctor, saveScheduleTime);

//Edit schedule time
router.post('/edit-schedule-time/:scheduleId', isDoctor, editScheduleTime);

//delete schedule
router.post('/delete-schedule/:scheduleId',isDoctor, deleteSchedule)

//cancel appointment by doctor
router.post('/cancel_appointment_by_doctor/:appointmentId', isDoctor, async (req, res) => {
    try {
        const appointmentId = req.params.appointmentId;
        // Find the appointment
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).send({ error: "Appointment not found." });
        }

        // Update the appointment status to "cancel by doctor"
        await Appointment.findByIdAndUpdate(appointmentId, { status: "cancel by doctor" });

        // Update the timeschedule status to "start"
        await TimeSchedule.findOneAndUpdate(
            { doctor: appointment.doctor, date: appointment.date },
            { status: "start" }
        );

        // Set success flash message
        req.flash('success', 'Appointment Cancel successfully.');
        res.redirect('/doctor-dashboard'); // Redirect to doctor's dashboard
    } catch (error) {
        console.error("Error accepting appointment:", error);
        // Set error flash message
        req.flash('error', 'An error occurred while cancel the appointment.');
        res.redirect('/doctor-dashboard'); // Redirect to doctor's dashboard with error flash message
    }
});

router.post('/appointment_accept_by_doctor/:appointmentId', isDoctor, async (req, res) => {
    try {
        const appointmentId = req.params.appointmentId;
        // Find the appointment
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).send({ error: "Appointment not found." });
        }

        // Update the appointment status to "accept by doctor"
        appointment.status = "accept by doctor";
        await appointment.save();

        // Update the timeschedule status to "start"
        await TimeSchedule.findOneAndUpdate(
            { doctor: appointment.doctor, date: appointment.date },
            { status: "start" }
        );

        req.flash('success', 'Appointment Accpeted successfully.');
        res.redirect('/doctor-dashboard'); // Redirect to doctor's dashboard or any other appropriate page
    } catch (error) {
        console.error("Error accepting appointment:", error);
        req.flash('error', 'An error occurred while accepting the appointment.');
        res.redirect('/doctor-dashboard'); // Redirect to doctor's dashboard with error flash message
    }
});


// Assuming you have a Prescription model defined using Mongoose
// Route to handle form submission
router.post('/save-prescription/:appointment_id', async (req, res) => {
    try {
        const appointmentId = req.params.appointment_id;
        const { doctorName, medicines, notes } = req.body; // Extracting form fields

        // Create a new Prescription instance
        const prescription = new Prescription({
            appointment: appointmentId,
            doctorName: doctorName,
            medicines: medicines,
            notes: notes
        });

        // Save the prescription to the database
        const savedPrescription = await prescription.save();

        // Set flash message
        req.flash('success', 'Prescription added successfully');

        // Redirect to add-prescription with appointment ID
        res.redirect(`/add-prescription/${appointmentId}`);
    } catch (error) {
        console.error('Error adding prescription:', error);
        req.flash('error', 'Failed to add prescription');
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



// Assuming you have a Prescription model

router.get('/view-prescription/:appointment_id', async (req, res) => {
    try {
        // Fetch prescription data from the database
        const prescription = await Prescription.findById(req.params.id);
        const appointmentId = req.params.appointment_id;

                // Find the appointment with the specified ID and populate the patient and doctor fields
                const appointment = await Appointment.findById(appointmentId)
                    .populate({
                        path: 'doctor',
                        populate: { path: 'specialityId' } // Populate the specialityId field of the doctor
                    })
                    .populate('patient');
        
                if (!appointment) {
                    // Handle the case where the appointment is not found
                    return res.status(404).json({ error: 'Appointment not found' });
                }
        
        // Render the invoice-view.html template with prescription data
        res.render('view-prescription', { prescription: prescription ,appointment });
    } catch (error) {
        console.error('Error fetching prescription:', error);
        res.status(500).send('Internal Server Error');
    }
});


router.get('/edit-prescription/:id', async (req, res) => {
    try {
        const prescriptionId = req.params.id;
        // Fetch the prescription by ID
        const prescription = await Prescription.findById(prescriptionId).populate('appointment');
        if (!prescription) {
            req.flash('error', 'Prescription not found');
            return res.redirect('/doctor-dashboard');
        }

        // Fetch the appointment details
        const appointment = await Appointment.findById(prescription.appointment).populate('patient doctor');
        if (!appointment) {
            req.flash('error', 'Appointment not found');
            return res.redirect('/doctor-dashboard');
        }

        res.render('edit-prescription', { prescription, appointment, error: req.flash('error'), success: req.flash('success') });
    } catch (err) {
        console.error(err);
        req.flash('error', 'An error occurred while fetching the prescription');
        res.redirect('/doctor-dashboard');
    }
});



router.post('/save-invoice/:appointment_id', async (req, res) => {
    try {
        const appointmentId = req.params.appointment_id;
        const { doctorName, amount, notes } = req.body; // Extracting form fields

        // Create a new Prescription instance
        const invoice = new Invoice({
            appointment: appointmentId,
            doctorName: doctorName,
            amount: amount,
            notes: notes
        });

        // Save the prescription to the database
        const savedInvoice = await invoice.save();

        // Set flash message
        req.flash('success', 'invoice added successfully');

        // Redirect to add-prescription with appointment ID
        res.redirect(`/add-invoice/${appointmentId}`);
    } catch (error) {
        console.error('Error adding invoice:', error);
        req.flash('error', 'Failed to add invoice');
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


module.exports = router;


