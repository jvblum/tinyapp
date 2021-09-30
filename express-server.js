const express = require('express');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');

const salt = bcrypt.genSaltSync(1.6543);
const app = express();
const PORT = 8080;

//
app.use(bodyParser.urlencoded({extended: true})); // bodyParser deprecated; possible alternative: "express.urlencoded";
app.use(cookieParser());
app.set('view engine', 'ejs');

// variables&&

const generateRandomString = (length) => {
  let res = '';
  const chars = 'pyfgcrlaoeuidhtnsqjkxbmwvzPYFGCRLAOEUIDHTNSQJKXBMWVZ1234567890';
  for (let i = 0; i < length; i++) {
    const rand = Math.floor(Math.random() * chars.length);
    res += chars[rand];
  }
  return res;
};

const urlDatabase = {
  'b2xVn2': {
    longURL:'http://www.lighthouselabs.ca'
  },
  '9sm5xK': {
    longURL: 'http://www.google.com'
  },
};

const usersDb = {
  tempId: {
    id: null,
    username: null,
    email: null,
    password: null
  },
  searchUsername(userReq) {
    for (const user in this) {
      if (this[user].username === userReq) return this[user]; // return user object
    }
    return false;
  },
  searchEmail(emailReq) {
    for (const user in this) {
      if (this[user].email === emailReq) return this[user]; // return user object
    }
    return false;
  }
};

const urlsForUser = (userId, urlsDb) => {
  const urls = [];
  for (const url in urlsDb) {
    if (urlsDb[url].userID === userId) urls.push(urlsDb[url].shortURL);
  }
  return urls;
};

const temp = {
  urls: urlDatabase,
  shortURL: null,
  longURL: null,
  user: null,
  cookie: null,
  edit: false
};

// register

app.get('/register', (req, res) => {
  res.render('register', temp);
});

app.post('/register', (req, res) => {

  const userInUse = usersDb.searchUsername(req.body.username);
  const emailInUse = usersDb.searchEmail(req.body.email);

  const id = generateRandomString(8);
  const email = req.body.email;
  const username = req.body.username;
  const password = bcrypt.hashSync(req.body.password, salt);
  

  if (!email || !username || !password) {
    res.status(400).send('please fill out the forms properly (i.e. users cannot submit empty forms)');
  } else if (userInUse) {
    res.status(400).send('username is already in use');
  } else if (emailInUse) {
    res.status(400).send('email is already in use');
  } else {

    usersDb[id] = {
      id,
      email,
      username,
      password
    };

    temp.user = email;
    temp.cookie = id;
    res.cookie('user_id', id);
    res.redirect('/urls');
  }
});

// login, logout

app.get('/login', (req, res) => {
  res.render('login', temp);
});

app.post('/login', (req, res) => {

  const email = usersDb.searchEmail(req.body.email);

  if (!email) res.status(403).send('email is not registered');
  else if (bcrypt.compareSync(email.password, req.body.password)) res.status(403).send('wrong password');
  else {
    temp.user = email.email;
    temp.cookie = email.id;
    res.cookie('user_id', email.id);
    res.redirect('/urls');
  }
  console.log(usersDb);
});

app.post('/logout', (req, res) => {
  temp.user = null;
  temp.cookie = null;
  res.clearCookie('user_id');
  res.redirect('/urls');
});

//

app.get('/', (req, res) => {
  res.redirect('/urls');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  if (!req.cookies.user_id) res.redirect('/restricted');
  else res.render('urls_index', temp);
});

app.post("/urls", (req, res) => {
  if (!req.cookies.user_id) res.redirect('/restricted');
  else {
    const shortURL = generateRandomString(6);
    urlDatabase[shortURL] = {userID: req.cookies.user_id, shortURL: shortURL, longURL: req.body.longURL};
    res.redirect(`/urls/${shortURL}`);
  }
});

app.get('/urls/new', (req, res) => {
  if (!req.cookies.user_id) res.redirect('/restricted');
  else res.render('urls_new', temp);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  if (!urlsForUser(temp.cookie, urlDatabase).includes(req.params.shortURL)) {
    res.status(403).send('does not have permission for request');
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }
});

app.post('/urls/:id/update', (req, res) => { // apparently needs to go before '/urls/:id'
  if (!urlsForUser(temp.cookie, urlDatabase).includes(req.params.id)) {
    res.status(403).send('does not have permission for request');
  } else {
    urlDatabase[req.params.id].longURL = req.body.longURL; // to-do - case if url doesn't go anywhere;
    res.redirect(`/urls/${req.params.id}`);
  }
});

app.post('/urls/:id', (req, res) => {
  //
  temp.shortURL = req.params.id;
  temp.longURL = urlDatabase[req.params.id].longURL;
  temp.edit = true;
  //
  res.render('urls_show', temp);
});

app.get('/urls/:shortURL', (req, res) => {
  //
  temp.shortURL = req.params.shortURL;
  temp.longURL = urlDatabase[req.params.shortURL].longURL;
  //
  res.render('urls_show', temp);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  if (!longURL.includes('http')) longURL = 'http://' + longURL; // quick solution; code does not redirect links without http://;
  res.redirect(longURL);
});

app.get('/restricted', (req, res) => {
  res.render('restricted', temp);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});