// ============== setup ==============

import express, { request, response } from 'express';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import pg from 'pg';

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

  const inputData = [content.inputFirstName, content.inputLastName, content.inputEmail, content.inputPassword];

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

// render dashboard page
const handleFileReadDashboard = (request, response) => {
  response.render('dashboard');
};

// ============== routes ==============

app.get('/', handleFileReadHome);
app.get('/signup', handleFileReadSignup);
app.post('/login', handleFileSaveSignup);
app.get('/login', handleFileReadLogin);
// app.post('/login', handleFileCheckLogin);
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
