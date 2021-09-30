const express = require('express');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser'); 
const app = express();
const PORT = 8080;
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

// const urlDatabase = {
//   'b2xVn2': 'http://www.lighthouselabs.ca',
//   '9sm5xK': 'http://www.google.com',
// };

const usersDb = {
  tempId: {
    id: null,
    username: null,
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
const temp = {
  urls: urlDatabase,
  shortURL: null,
  longURL: null,
  user: null,
  edit: false};

// register

app.get('/register', (req, res) => {
  res.render('register', temp);
});

app.post('/register', (req, res) => {
  const genId = generateRandomString(8);
  const srcUser = usersDb.searchUsername(req.body.username);
  const srcEmail = usersDb.searchEmail(req.body.email);

  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;
  
  if (!email || !username || !password) {
    res.status(400).send('please fill out the forms properly (i.e. users cannot submit empty forms)');
  } else if (srcUser) {
    res.status(400).send('username exists');
  } else if (srcEmail) {
    res.status(400).send('email is already in use');
  } else {
    usersDb[genId] = {
      id: genId,
      email: email,
      username: username,
      password: password
    };
    temp.user = email;
    res.cookie('user_id', genId);
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
  else if (req.body.password !== email.password) res.status(403).send('wrong password');
  else {
    temp.user = email.email;
    res.cookie('user_id', email.id);
    res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  temp.user = null;
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
  res.render('urls_index', temp);
});

app.post("/urls", (req, res) => {
  if(!req.cookies.user_id) res.send('this feature is for registered users only')
  else {
    const shortURL = generateRandomString(6);
    urlDatabase[shortURL] = {userID: req.cookies.user_id, shortURL: shortURL, longURL: req.body.longURL};
    res.redirect(`/urls/${shortURL}`);
  }
});

app.get('/urls/new', (req, res) => {
  if(req.cookies.user_id) res.render('urls_new', temp);
  else res.redirect('/login');
});

app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.post('/urls/:id/update', (req, res) => { // apparently needs to go before '/urls/:id'
  //
  urlDatabase[req.params.id].longURL = req.body.longURL; // to-do - case if url doesn't go anywhere;
  //

  res.redirect(`/urls/${req.params.id}`);
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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});