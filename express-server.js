const express = require('express');
const bodyParser = require("body-parser");
const app = express();
const PORT = 8080;
app.use(bodyParser.urlencoded({extended: true})); // bodyParser deprecated; possible alternative: "express.erlencoded";
app.set('view engine', 'ejs');

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
const user = {name: null}; // student cannot make the instructions work, thus this approach;

app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  user.name = req.body.username;
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  user.name = null;
  res.clearCookie('username');
  res.redirect('/urls');
});

app.get('/', (req, res) => {
  res.send('Hello there. Add "/urls" to get anywhere.');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  const temp = {urls: urlDatabase, username: null};
  if (user.name) temp.username = user.name;
  res.render('urls_index', temp);
});

app.get('/urls/new', (req, res) => {
  const temp = {edit: false, username: null};
  if (user.name) temp.username = user.name;
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
  urlDatabase[req.params.id] = req.body.longURL; // to-do - case if url doesn't go anywhere;
  res.redirect(`/urls/${req.params.id}`);
});

app.post('/urls/:id', (req, res) => {
  const temp = {shortURL: req.params.id, longURL: urlDatabase[req.params.id], edit: true, username: null};
  if (user.name) temp.username = user.name;
  res.render('urls_show', temp);
});

app.get('/urls/:shortURL', (req, res) => {
  const temp = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], edit: null, username: null};
  if (user.name) temp.username = user.name;
  res.render('urls_show', temp);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
