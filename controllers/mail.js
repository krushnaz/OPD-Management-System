const nodemailer = require('nodemailer');

//sending email
const transporter = nodemailer.createTransport({
    service: 'gmail',
  
    auth: {
      user: 'sangramonlinework99@gmail.com',
      pass: 'conf cxvu vtuz vxbw'
    }
});

module.exports = transporter;