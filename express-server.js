const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const {
  getUserByEmail,
  urlsForUser,
  generateRandomString,
  doesThisUrlIdExist,
  templateVariable
} = require('./helpers');

const salt = bcrypt.genSaltSync(1.6543);
const app = express();
const PORT = 8080;

//
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['fkcngevkecn cpf jkuvqtkecn ocvgtkcnkuo'],
}));


app.set('view engine', 'ejs');

// variables&&

const urlDatabase = {
  tempShortUrl: {
    userID: null,
    shortURL: null,
    longURL: null
  }
};

const usersDb = {
  tempId: {
    id: null,
    email: null,
    password: null
  }
};

// register

app.get('/register', (req, res) => {
  
  const session = req.session.userId;
  const temp = templateVariable(session, usersDb, urlDatabase);
  
  res.render('register', temp);
});

app.post('/register', (req, res) => {

  const emailInUse = getUserByEmail(req.body.email, usersDb);

  const id = generateRandomString(8);
  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password, salt);
  

  if (!req.body.email || !req.body.password) {
    return res.status(400).send('please fill out the forms properly (i.e. users cannot submit empty forms)');
  }

  if (emailInUse) {
    return res.status(400).send('email is already in use');
  }

  usersDb[id] = {
    id,
    email,
    password
  };

  req.session.userId = id;
  res.redirect('/urls');
  
});

// login, logout

app.get('/login', (req, res) => {

  const session = req.session.userId;
  const temp = templateVariable(session, usersDb, urlDatabase);

  // if user is logged in: redirects to /urls
  if (req.session.userId) {
    return res.redirect('/urls');
  }

  res.render('login', temp);
});

app.post('/login', (req, res) => {

  if (!req.body.email || !req.body.password) {
    return res.status(400).send('please fill out the forms properly (i.e. users cannot submit empty forms)');
  }

  const user = getUserByEmail(req.body.email, usersDb);

  if (!user) {
    return res.status(403).send('email is not registered');
  }

  if (!bcrypt.compareSync(req.body.password, user.password)) {
    return res.status(403).send('wrong password');
  }

  req.session.userId = user.id;
  res.redirect('/urls');
    
});

app.post('/logout', (req, res) => {
  req.session.userId = null;
  res.redirect('/urls');
});

// urls

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {

  const session = req.session.userId;
  const temp = templateVariable(session, usersDb, urlDatabase);

  // if user is not logged in: returns HTML with a relevant error message
  if (!req.session.userId) {
    return res.redirect('/restricted');
  }

  res.render('urls_index', temp);
});

app.post('/urls', (req, res) => { // create new shortURL

  // if user is not logged in...
  if (!req.session.userId) {
    return res.status(403).send('error 403: does not have permission for request');
  }

  const shortURL = generateRandomString(6);
  urlDatabase[shortURL] = {
    userID: req.session.userId,
    shortURL,
    longURL: req.body.longURL
  };

  res.redirect(`/urls/${shortURL}`);

});

// urls/:

app.get('/urls/new', (req, res) => {

  const session = req.session.userId;
  const temp = templateVariable(session, usersDb, urlDatabase);

  // if user is not logged in: redirects to the /login page
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  res.render('urls_new', temp);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  
  // if user is not logged in...
  if (!req.session.userId) {
    return res.status(403).send('error 403: does not have permission for request');
  }
  
  // if user is logged it but does not own the URL for the given ID...
  if (!urlsForUser(req.session.userId, urlDatabase).includes(req.params.shortURL)) {
    return res.status(403).send('error 403: does not have permission for request');
  }

  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');

});

app.post('/urls/:id', (req, res) => {

  if (!doesThisUrlIdExist(req.params.id, urlDatabase)) {
    return res.status(404).send('error 404: this url does not exist');
  }

  // if user is not logged in...
  if (!req.session.userId) {
    return res.status(403).send('error 403: does not have permission for request');
  }

  if (!urlsForUser(req.session.userId, urlDatabase).includes(req.params.id)) {
    return res.status(403).send('error 403: does not have permission for request');
  }

  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect(`/urls/${req.params.id}`);
  
}); 

app.get('/urls/:shortURL', (req, res) => {

  const session = req.session.userId;

  // if a URL for the given ID does not exist: returns HTML with a relevant error message
  if (!doesThisUrlIdExist(req.params.shortURL, urlDatabase)) {
    return res.status(404).send('error 404: this url does not exist');
  }

  // if user is not logged in...
  if (!req.session.userId) {
    return res.status(403).send('error 403: does not have permission for request');
  }

  // if user is logged it but does not own the URL with the given ID: returns HTML with a relevant error message
  if (!urlsForUser(req.session.userId, urlDatabase).includes(req.params.shortURL)) {
    return res.status(403).send('error 403: does not have permission for request');
  }
  
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  const temp = templateVariable(session, usersDb, urlDatabase, longURL, shortURL);
  
  res.render('urls_show', temp);
});

//

app.get('/u/:shortURL', (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  if (!longURL.includes('http')) {
    longURL = 'http://' + longURL;
  }// quick solution // code does not redirect links without http://;

  res.redirect(longURL);
});

// other routes

app.get('/', (req, res) => {
  
  // if user is not logged in: redirect to /login
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  // if user is logged in: redirect to /urls
  res.redirect('/urls');
});

app.get('/restricted', (req, res) => {

  const session = req.session.userId;
  const temp = templateVariable(session, usersDb, urlDatabase);

  res.render('restricted', temp);
});

//

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});