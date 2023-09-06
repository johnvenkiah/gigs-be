const path = require('path');
const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const transporter = require('./config');
require('dotenv').config();

const app = express();

const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';
const GOOGLE_PRIVATE_KEY = process.env.PRIVATE_KEY.replace(/\\n/g, '\n');
const GOOGLE_CLIENT_EMAIL = process.env.CLIENT_EMAIL;
const GOOGLE_PROJECT_NUMBER = process.env.PROJECT_NUMBER;
const GOOGLE_CALENDAR_ID = process.env.CALENDAR_ID;
const PORT = process.env.PORT || 3030;

var corsOptions = {
  origin: 'https://johnvenkiah.com',
  // origin: 'http://localhost:3000',
  optionsSuccessStatus: 200,
};

app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));
app.use(cors(corsOptions));

app.get('/events', async (req, res) => {
  try {
    const jwtClient = new google.auth.JWT(
      GOOGLE_CLIENT_EMAIL,
      null,
      GOOGLE_PRIVATE_KEY,
      SCOPES
    );

    const calendar = google.calendar({
      version: 'v3',
      project: GOOGLE_PROJECT_NUMBER,
      auth: jwtClient,
    });
    const { data } = await calendar.events.list({
      calendarId: GOOGLE_CALENDAR_ID,
      timeMin: new Date().toISOString(),
      maxResults: 10,
      fields: 'items(id,summary,description,location,start/dateTime)',
      singleEvents: true,
      orderBy: 'startTime',
    });
    data.items ? res.json(data.items) : res.json('No upcoming events found.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

app.post('/send', (req, res) => {
  try {
    const mailOptions = {
      from: req.body.email, // sender address
      to: process.env.EMAIL, // list of receivers
      subject: `johnvenkiah.com - ${req.body.subject}`, // Subject line
      html: `
      <h3>Contact Request From ${req.body.name}</h3>
      <p><strong>From: </strong>${req.body.name} | ${req.body.email}</p>
      <p><strong>Subject: </strong>johnvenkiah.com - ${req.body.subject}</li>
      <h4>Message:</h4>
      <p>${req.body.message}</p>
      `,
    };

    transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        console.log(err);
        res.status(500).send({
          success: false,
          message: 'Something went wrong. Try again later',
        });
      } else {
        res.send({
          success: true,
          message: "Thanks for writing, I'll get back to you soon!",
        });
      }
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error,
    });
  }
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
