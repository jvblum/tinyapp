const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const {
  getUserByEmail,
  urlsForUser,
  generateRandomString,
  doesThisUrlIdExist
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
app.use((req, res, next) => { // misc template handling

  if (req.session.userId) {
    temp.id = req.session.userId; // for index generation (urls_index)
    if (usersDb[req.session.userId]) {
      temp.user = usersDb[req.session.userId].email; // for display name (header)
    }
  } else {
    temp.id = null;
    temp.user = null;
  }

  next();
});

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

// template variables
const temp = {
  urls: urlDatabase,
  shortURL: null,
  longURL: null,
  user: null,
  id: null
};

// register

app.get('/register', (req, res) => {

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
  if (bcrypt.compareSync(user.password, req.body.password)) {
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

app.post('/urls/:id/update', (req, res) => {
  
  if (!urlsForUser(req.session.userId, urlDatabase).includes(req.params.id)) {
    return res.status(403).send('error 403: does not have permission for request');
  }

  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect(`/urls/${req.params.id}`);
  
}); // needs to go before post requesting for '/urls/:id'

app.post('/urls/:id', (req, res) => {

  // if user is not logged in...
  if (!req.session.userId) {
    return res.status(403).send('error 403: does not have permission for request');
  }
  
  if (!doesThisUrlIdExist(req.params.id, urlDatabase)) {
    return res.status(404).send('error 404: this url does not exist');
  }
  res.render('urls_show', temp);

});

app.get('/urls/:shortURL', (req, res) => {

  // if user is not logged in: returns HTML with a relevant error message
  if (!req.session.userId) {
    return res.redirect('/restricted');
  }

  // if user is logged it but does not own the URL with the given ID: returns HTML with a relevant error message
  if (!urlsForUser(req.session.userId, urlDatabase).includes(req.params.shortURL)) {
    return res.status(403).send('error 403: does not have permission for request');
  }
  
  // if a URL for the given ID does not exist: returns HTML with a relevant error message
  if (!doesThisUrlIdExist(req.params.shortURL, urlDatabase)) {
    return res.status(404).send('error 404: this url does not exist');
  }

  temp.shortURL = req.params.shortURL;
  temp.longURL = urlDatabase[req.params.shortURL].longURL;
  
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


  res.render('restricted', temp);
});

//

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});