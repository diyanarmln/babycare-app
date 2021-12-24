// ============== setup ==============

import express, { request, response } from 'express';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import pg from 'pg';
import jsSHA from 'jssha';

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
  const shaObj = new jsSha('SHA-512', 'TEXT', { encoding: 'UTF8' });

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

  // initialise the SHA object
  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
  // input the password from the request to the SHA object
  shaObj.update(request.body.inputPassword);
  // get the hashed password as output from the SHA object
  const hashedPassword = shaObj.getHash('HEX');

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
  pool.query('SELECT * from account WHERE email=$1', values, (error, result) => {
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

    // set the loggedInHash and userId cookies in the response
    response.cookie('loggedInHash', hashedCookieString);
    response.cookie('userId', user.id);
    // end the request-response cycle
    response.redirect('/dashboard');
  });
};

// render dashboard page
const handleFileReadDashboard = (request, response) => {
  response.render('dashboard');
};

// ============== routes ==============

app.get('/', handleFileReadHome);
app.get('/signup', handleFileReadSignup);
app.post('/login', handleFileSaveSignup);
app.get('/login', handleFileReadLogin);
app.post('/dashboard', handleFileCheckLogin);
app.get('/dashboard', handleFileReadDashboard);
// app.get('/soiled-diaper', handleFileReadSoiled);
// app.post('/soiled-diaper', handleFileSaveSoiled);
// app.get('/wet-diaper', handleFileReadWet);
// app.post('/wet-diaper', handleFileSaveWet);
// app.get('/milk', handleFileReadMilk);
// app.post('/milk', handleFileSaveMilk);
// app.get('/sleep', handleFileReadSleep);
// app.post('/sleep', handleFileSaveSleep);
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
