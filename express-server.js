const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const {
  getUserByEmail,
  getUserByUsername,
  urlsForUser,
  generateRandomString,
  doesThisUrlIdExist
} = require('./helpers');

const salt = bcrypt.genSaltSync(1.6543);
const app = express();
const PORT = 8080;

//
app.use(bodyParser.urlencoded({extended: true})); // bodyParser deprecated; possible alternative: "express.urlencoded";
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['fkcngevkecn cpf jkuvqtkecn ocvgtkcnkuo'],
}));
app.use((req, res, next) => { // misc template handling
  
  if (urlsForUser(req.session.userId, urlDatabase).includes(temp.shortURL)) {
    temp.edit = true;
  } else {
    temp.edit = false;
  }

  if (req.session.userId) {
    temp.id = req.session.userId;
    if (usersDb[req.session.userId]) {
      temp.user = usersDb[req.session.userId].email;
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
    username: null,
    email: null,
    password: null
  }
};

const temp = {
  urls: urlDatabase,
  shortURL: null,
  longURL: null,
  user: null,
  edit: null,
  id: null
};

// register

app.get('/register', (req, res) => {

  res.render('register', temp);
});

app.post('/register', (req, res) => {

  const userInUse = getUserByUsername(req.body.username, usersDb);
  const emailInUse = getUserByEmail(req.body.email, usersDb);

  const id = generateRandomString(8);
  const email = req.body.email;
  const username = req.body.username;
  const password = bcrypt.hashSync(req.body.password, salt);
  

  if (!email || !username || !password) {
    return res.status(400).send('please fill out the forms properly (i.e. users cannot submit empty forms)');
  } 
  if (userInUse) {
    return res.status(400).send('username is already in use');
  } 
  if (emailInUse) {
    return res.status(400).send('email is already in use');
  }

  usersDb[id] = {
    id,
    email,
    username,
    password
  };

  req.session.userId = id;
  res.redirect('/urls');
  
});

// login, logout

app.get('/login', (req, res) => {

  res.render('login', temp);
});

app.post('/login', (req, res) => {

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

  if (!req.session.userId) {
    return res.redirect('/restricted');
  }

  res.render('urls_index', temp);
});

app.post('/urls', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/restricted');
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

app.post('/urls/:shortURL/delete', (req, res) => {
  
  if (!urlsForUser(req.session.userId, urlDatabase).includes(req.params.shortURL)) {
    return res.status(403).send('error 403: does not have permission for request');
  } 

  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');

});

app.post('/urls/:id/update', (req, res) => { // apparently needs to go before '/urls/:id'
  
  if (!urlsForUser(temp.id, urlDatabase).includes(req.params.id)) {
   return res.status(403).send('error 403: does not have permission for request');
  }

  urlDatabase[req.params.id].longURL = req.body.longURL; 
  res.redirect(`/urls/${req.params.id}`);
  
});

app.post('/urls/:id', (req, res) => {
  
  if (!doesThisUrlIdExist(req.params.id, urlDatabase)) {
    return res.status(404).send('error 404: this url does not exist');
  }
  res.render('urls_show', temp);

});

app.get('/urls/:shortURL', (req, res) => {

  if (!doesThisUrlIdExist(req.params.shortURL, urlDatabase)) {
    return res.status(404).send('error 404: this url does not exist');
  }

  temp.shortURL = req.params.shortURL;
  temp.longURL = urlDatabase[req.params.shortURL].longURL;
  
  res.render('urls_show', temp);
});

app.get('/urls/new', (req, res) => {

  if (!req.session.userId) {
    return res.redirect('/restricted');
  }

  res.render('urls_new', temp);
});

//

app.get('/', (req, res) => {
  res.redirect('/urls');
});


app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  if (!longURL.includes('http')) {
    longURL = 'http://' + longURL;
  }// quick solution; code does not redirect links without http://;
  res.redirect(longURL);
});

app.get('/urls/new', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/restricted');
  }
  res.render('urls_new', temp);
});

//

app.get('/restricted', (req, res) => {
  const temp = { user: null };
  res.render('restricted', temp);
});

app.get('/', (req, res) => {
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});