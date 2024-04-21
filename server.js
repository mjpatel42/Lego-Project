/********************************************************************************
 * WEB322 – Assignment 06
 *
 * I declare that this assignment is my own work in accordance with Seneca's
 * Academic Integrity Policy:
 *
 * https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
 *
 * Name: Patel Manankumar Jagdishkumar
 * Student ID: 136666237
 * Date: 20/04/2024
 *
 * Published URL:
 ********************************************************************************/

const express = require('express');
const path = require('path');
const legoData = require('./modules/legoSets');
const authData = require('./modules/auth-service');
const clientSessions = require('client-sessions');
const app = express();
const HTTP_PORT = process.env.PORT || 8080;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(clientSessions({
  cookieName: 'session',
  secret: 'random_secret_string',
  duration: 24 * 60 * 60 * 1000,
  activeDuration: 1000 * 60 * 5
}));
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});
app.set('view engine', 'ejs');

// Function to fetch random quote
async function getRandomQuote() {
  try {
    const fetch = await import('node-fetch').then((module) => module.default);
    const response = await fetch('https://api.quotable.io/random');
    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('Error fetching quote:', error);
    throw new Error('An error occurred while fetching the quote.');
  }
}

// Routes
app.get('/', async (req, res) => {
  try {
    const quote = await getRandomQuote();
    res.render('home', { quote });
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).render('500', { message: 'An error occurred while fetching the quote.' });
  }
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/quote', async (req, res) => {
  try {
    const quote = await getRandomQuote();
    res.render('quote', { quote });
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).render('500', { message: 'An error occurred while fetching the quote.' });
  }
});

app.get('/lego/sets', async (req, res) => {
  try {
    const sets = req.query.theme ? await legoData.getSetsByTheme(req.query.theme) : await legoData.getAllSets();
    res.render('sets', { sets, page: '/lego/sets' });
  } catch (error) {
    console.error('Error fetching sets:', error);
    res.status(500).render('500', { message: 'An error occurred while fetching sets.' });
  }
});

app.get('/lego/sets/:num', async (req, res) => {
  try {
    const set = await legoData.getSetByNum(req.params.num);
    res.render('legoSetDetail', { set, page: '/lego/sets' });
  } catch (error) {
    console.error('Error fetching set:', error);
    res.status(404).send('Set not found');
  }
});

// GET route for rendering the addSet view
app.get('/lego/addSet', async (req, res) => {
  try {
    const themes = await legoData.getAllThemes();
    res.render('addSet', { themes });
  } catch (error) {
    console.error('Error fetching themes:', error);
    res.status(500).send('An error occurred while fetching themes.');
  }
});

// POST route for processing the form data and adding a new set
app.post('/lego/addSet', async (req, res) => {
  try {
    await legoData.addSet(req.body);
    res.redirect('/lego/sets');
  } catch (error) {
    console.error('Error adding set:', error);
    res.render('500', { message: `I'm sorry, but we have encountered an error: ${error}` });
  }
});

// GET route for rendering the editSet view
app.get('/lego/editSet/:num', async (req, res) => {
  try {
    const set = await legoData.getSetByNum(req.params.num);
    const themes = await legoData.getAllThemes();
    res.render('editSet', { set, themes });
  } catch (error) {
    console.error('Error fetching set for edit:', error);
    res.status(404).send('Set not found');
  }
});

// POST route for processing the form data and updating a set
app.post('/lego/editSet/:num', async (req, res) => {
  try {
    const setNum = req.params.num;
    await legoData.updateSet(setNum, req.body);
    res.redirect(`/lego/sets/${setNum}`);
  } catch (error) {
    console.error('Error updating set:', error);
    res.render('500', { message: `An error occurred while updating the set: ${error}` });
  }
});

// Route to delete a set
app.get('/lego/deleteSet/:num', async (req, res) => {
  try {
    const setNum = req.params.num;
    await legoData.deleteSet(setNum);
    res.redirect('/lego/sets');
  } catch (error) {
    console.error('Error deleting set:', error);
    res.status(500).render('500', { message: `I'm sorry, but we have encountered the following error: ${error}` });
  }
});



// Route to render the login view
app.get('/login', (req, res) => {
  res.render('login', { errorMessage: null, userName: null });
});


// Route to render the register view
app.get('/register', (req, res) => {
  res.render('register', { errorMessage: null, userName: null });
});

// POST route to handle user registration
app.post('/register', async (req, res) => {
  try {
    const userData = req.body;
    await authData.registerUser(userData);
    res.render('register', { successMessage: "User created" });
  } catch (error) {
    res.render('register', { errorMessage: error, userName: req.body.userName });
  }
});
// Route to handle user login
app.post('/login', async (req, res) => {
  try {
    req.body.userAgent = req.get('User-Agent');
    const user = await authData.checkUser(req.body);
    req.session.user = {
      userName: user.userName,
      email: user.email,
      loginHistory: user.loginHistory
    };
    res.redirect('/lego/sets');
  } catch (error) {
    res.render('login', { errorMessage: error, userName: req.body.userName });
  }
});

// Route to handle user logout
app.get('/logout', (req, res) => {
  req.session.reset();
  res.redirect('/');
});

// Route to render the userHistory view
app.get('/userHistory', ensureLogin, (req, res) => {
  res.render('userHistory', { loginHistory: req.session.user.loginHistory });
});


// Custom middleware to ensure user is logged in
function ensureLogin(req, res, next) {
  if (req.session && req.session.user) {
    // User is logged in
    next();
  } else {
    // User is not logged in, redirect to login route
    res.redirect('/login');
  }
}


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500', { message: 'Internal Server Error' });
});

// Initialize database and start servers
legoData.initialize()
  .then(authData.initialize)
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log(`Server listening on: http://localhost:${HTTP_PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error initializing database:', error);
  });

module.exports = app;
