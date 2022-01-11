// ============== setup ==============

import express, { request, response } from 'express';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import pg from 'pg';
import jsSHA from 'jssha';
import multer from 'multer';
import axios from 'axios';

// Initialise DB connection
const { Pool } = pg;
const pgConnectionConfigs = {
  user: 'diyanaramlan',
  host: 'localhost',
  database: 'babycare',
  port: 5432, // Postgres server always runs on this port by default
};
const pool = new Pool(pgConnectionConfigs);

const app = express();
app.use(express.static('public'));

app.use(cookieParser());
app.set('view engine', 'ejs');
// Override POST requests with query param ?_method=PUT to be PUT requests
app.use(methodOverride('_method'));
// Configure Express to parse request body data into request.body
app.use(express.urlencoded({ extended: false }));

// ============== helper functions ==============
const SALT = 'everyday is awesome';

const getHash = (input) => {
  // create new SHA object
  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });

  // create an unhashed cookie string based on user ID and salt
  const unhashedString = `${input}-${SALT}`;

  // generate a hashed cookie string using SHA object
  shaObj.update(unhashedString);

  return shaObj.getHash('HEX');
};

// ============== route helper funtions ==============

// render home page
const handleFileReadHome = (request, response) => {
  response.render('home');
};

// render signup page
const handleFileReadSignup = (request, response) => {
  response.render('signup');
};

// save new account registration via POST request from our form
const handleFileSaveSignup = (request, response) => {
  const content = request.body;

  // hash the password
  const hashedPassword = getHash(request.body.inputPassword);

  const inputData = [content.inputFirstName, content.inputLastName, content.inputEmail, hashedPassword];

  const sqlInsert = 'INSERT INTO account (first_name, last_name, email, password) VALUES ($1, $2, $3, $4)';

  pool.query(sqlInsert, inputData, (error, result) => {
    if (error) {
      response.status(500).send('DB write error');
      console.log('DB write error', error.stack);
      return;
    }

    console.log('qeury inserted', result);

    response.redirect('/login');
  });
};

// render login page
const handleFileReadLogin = (request, response) => {
  response.render('login');
};

// authenticate user login
const handleFileCheckLogin = (request, response) => {
  // retrieve the user entry using their email
  const values = [request.body.inputEmail];
  pool.query('SELECT * from account LEFT JOIN profile ON profile.account_id = account.account_id WHERE email=$1;', values, (error, result) => {
    console.log('login', result);
    // return if there is a query error
    if (error) {
      console.log('Error executing query', error.stack);
      response.status(503).send(result.rows);
      return;
    }

    // we didnt find a user with that email
    if (result.rows.length === 0) {
      // the error for incorrect email and incorrect password are the same for security reasons.
      // This is to prevent detection of whether a user has an account for a given service.
      response.status(403).send('login failed!');
      return;
    }

    // get user record from results
    const user = result.rows[0];
    const hashedPassword = getHash(request.body.inputPassword);
    console.log(hashedPassword);

    // If the user's hashed password in the database does not match the hashed input password, login fails
    if (user.password !== hashedPassword) {
      // the error for incorrect email and incorrect password are the same for security reasons.
      // This is to prevent detection of whether a user has an account for a given service.
      response.status(403).send('login failed!');
      return;
    }

    // The user's password hash matches that in the DB and we authenticate the user.

    // create an unhashed cookie string based on user ID and salt
    const unhashedCookieString = `${user.id}-${SALT}`;
    const hashedCookieString = getHash(unhashedCookieString);

    const userID = user.account_id;
    const profileID = user.profile_id;

    // set the loggedInHash and userId cookies in the response
    response.cookie('loggedInHash', hashedCookieString);
    response.cookie('userId', user.id);
    // end the request-response cycle
    response.redirect(`/dashboard/${userID}/${profileID}`);
  });
};

// render dashboard page ========= TO DELETE
const handleFileReadDashboard = (request, response) => {
  response.render('dashboard');
};

// save soiled diaper event via POST request from form
const handleFileSaveSoiled = (request, response) => {
  console.log('request', request.params);
  const content = request.body;
  const eventId = 1;
  console.log(content);
  const { user } = request.params;
  const { profile } = request.params;

  const inputData = [profile, content.inputSoiledDate, content.inputSoiledTime, eventId, content.inputSoiledColour];

  const sqlInsert = 'INSERT INTO log (profile_id, date, time, event_id, stool_colour) VALUES ($1, $2, $3, $4, $5)';

  pool.query(sqlInsert, inputData, (error, result) => {
    if (error) {
      response.status(500).send('DB write error');
      console.log('DB write error', error.stack);
      return;
    }

    console.log('qeury inserted', result);

    response.redirect(`/dashboard/${user}/${profile}`);
  });
};

// save wet diaper event via POST request from form
const handleFileSaveWet = (request, response) => {
  console.log('request', request.params);
  const content = request.body;
  const eventId = 2;
  console.log(content);
  const { user } = request.params;
  const { profile } = request.params;

  const inputData = [profile, content.inputWetDate, content.inputWetTime, eventId, content.inputWetWeight];
  // console.log('wet', inputData);

  const sqlInsert = 'INSERT INTO log (profile_id, date, time, event_id, nappy_weight) VALUES ($1, $2, $3, $4, $5)';

  pool.query(sqlInsert, inputData, (error, result) => {
    if (error) {
      response.status(500).send('DB write error');
      console.log('DB write error', error.stack);
      return;
    }

    console.log('qeury inserted wet', result);

    response.redirect(`/dashboard/${user}/${profile}`);
  });
};

// save milk event via POST request from form
const handleFileSaveMilk = (request, response) => {
  console.log('request', request.params);
  const content = request.body;
  const eventId = 3;
  console.log(content);
  const { user } = request.params;
  const { profile } = request.params;

  const inputData = [profile, content.inputMilkDate, content.inputMilkTime, eventId, content.inputMilkQty];
  // console.log('wet', inputData);

  const sqlInsert = 'INSERT INTO log (profile_id, date, time, event_id, milk_qty) VALUES ($1, $2, $3, $4, $5)';

  pool.query(sqlInsert, inputData, (error, result) => {
    if (error) {
      response.status(500).send('DB write error');
      console.log('DB write error', error.stack);
      return;
    }

    console.log('qeury inserted milk', result);

    response.redirect(`/dashboard/${user}/${profile}`);
  });
};

// save sleep event via POST request from form
const handleFileSaveSleep = (request, response) => {
  console.log('request', request.params);
  const content = request.body;
  const eventId = 4;
  console.log(content);
  const { user } = request.params;
  const { profile } = request.params;

  const inputData = [profile, content.inputSleepStartDate, content.inputSleepStartTime, eventId, content.inputSleepEndDate, content.inputSleepEndTime];
  // console.log('wet', inputData);

  const sqlInsert = 'INSERT INTO log (profile_id, date, time, event_id, end_date, end_time) VALUES ($1, $2, $3, $4, $5, $6)';

  pool.query(sqlInsert, inputData, (error, result) => {
    if (error) {
      response.status(500).send('DB write error');
      console.log('DB write error', error.stack);
      return;
    }

    console.log('qeury inserted sleep', result);

    response.redirect(`/dashboard/${user}/${profile}`);
  });
};

// ============== routes ==============

app.get('/', handleFileReadHome);
app.get('/signup', handleFileReadSignup);
app.post('/signup', handleFileSaveSignup);
app.get('/login', handleFileReadLogin);
app.post('/login', handleFileCheckLogin);

app.get('/dashboard/:user/:profile', handleFileReadDashboard);
app.post('/dashboard/:user/:profile/soiled', handleFileSaveSoiled);
app.post('/dashboard/:user/:profile/wet', handleFileSaveWet);
app.post('/dashboard/:user/:profile/milk', handleFileSaveMilk);
app.post('/dashboard/:user/:profile/sleep', handleFileSaveSleep);

// app.get('/profile/photo/:id', handleFileReadProfilePhoto);
// app.get('/profile/photo/:id/edit', handleFileReadEditPhoto);
// app.put('/profile/photo/:id/edit', handleFileSaveEditPhoto);
// app.get('/profile/:id/edit', handleFileReadProfileEdit);
// app.put('/profile/:id/edit', handleFileSaveProfileEdit);
// app.get('/profile/add', handleFileReadAddProfile);
// app.post('/profile/add', handleFileSaveAddProfile);
// app.get('/settings', handleFileReadSettings);
// app.get('/forgetpassword', handleFileReadForgetPassword);

app.listen(3004);
