require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const cron = require('node-cron');
const mongoose = require('mongoose');
const flash = require('express-flash');
const session = require('express-session');
const mongoDbSession = require('connect-mongodb-session')(session);
const { adminMiddleware, specialityMiddleware, doctorMiddleware } = require('./controllers/adminMiddleware');
const { TimeSchedule } = require('./models/doctorModel');


// Set view engine
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Serve static assets
app.use(express.static(path.join(__dirname, 'views', 'assets')));
app.use('/admin/assets', express.static(path.join(__dirname, 'views', 'admin', 'assets')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('./views/assets' ,express.static('assets'));

// Connect to MongoDB
mongoose.connect(process.env.DB_URI)
    .then(() => {
        console.log("Database Connected Successfully");
    })
    .catch((err) => {
        console.error("Error connecting to database:", err);
    });

// Initialize session store
const store = new mongoDbSession({
    uri: process.env.DB_URI,
    collection: 'sessions'
});

// Session middleware
app.use(session({
    secret: 'This is a big secret',
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// Flash messages middleware
app.use(flash());

// Custom middleware
app.use(adminMiddleware);
app.use(specialityMiddleware);
app.use(doctorMiddleware); 

// Require and use route files
app.use(require('./routes/auth/routes'));
app.use(require('./routes/admin/routes')); 
app.use(require('./routes/patient/routes'));
app.use(require('./routes/doctor/routes'));  

app.get('*', (req, res) => {
    res.render('../views/admin/error-404');
});
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

//HOST to access the web from anywhere in network
const HOST = process.env.HOST;

// Start the server
const PORT = process.env.PORT || 8000; 
app.listen(PORT, HOST, () => {
    console.log(`Server is running on port http://localhost:${PORT}/`);
});
