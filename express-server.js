const express = require('express');
const bodyParser = require("body-parser");
// const cookieParser = require('cookie-parser'); // disabled
const app = express();
const PORT = 8080;
app.use(bodyParser.urlencoded({extended: true})); // bodyParser deprecated; possible alternative: "express.urlencoded";
// app.use(cookieParser()); // disabled
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
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com',
};

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
  }
};
const temp = {
  urls: urlDatabase, 
  shortURL: null, 
  longURL: null, 
  username: null, 
  edit: false};

// register 

app.get('/register', (req, res) => {
  res.render('register', temp);
});

app.post('/register', (req, res) => {
  const genId = generateRandomString(8);
  const user = usersDb.searchUsername(req.body.username);
  
  if (user) res.send('username exists')
  else {
    usersDb[genId] = {
      id: genId,
      email: req.body.email,
      username: req.body.username,
      password: req.body.password
    };
    console.log(usersDb);
    temp.username = req.body.username;
    res.cookie('user_id', user.id);
    res.redirect('/urls');
  }
});

// login, logout

app.get('/login', (req, res) => {
  res.render('login', temp);
})

app.post('/login', (req, res) => {
  const user = usersDb.searchUsername(req.body.username);
  if (!user) res.send('user does not exist'); 
  else if (req.body.password !== user.password) res.send('wrong password');
  else {
    temp.username = req.body.username;
    res.cookie('user_id', user.id);
    res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  temp.username = null;
  res.clearCookie('username');
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

app.get('/urls/new', (req, res) => {
  res.render('urls_new', temp);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString(6);
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.post('/urls/:id/update', (req, res) => { // apparently needs to go before '/urls/:id'
  //
  urlDatabase[req.params.id] = req.body.longURL; // to-do - case if url doesn't go anywhere;
  //
  res.redirect(`/urls/${req.params.id}`);
});

app.post('/urls/:id', (req, res) => {
  //
  temp.shortURL = req.params.id; 
  temp.longURL = urlDatabase[req.params.id];
  temp.edit = true;
  //
  res.render('urls_show', temp);
});

app.get('/urls/:shortURL', (req, res) => {
  //
  temp.shortURL = req.params.shortURL; 
  temp.longURL = urlDatabase[req.params.shortURL];
  //
  res.render('urls_show', temp);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});