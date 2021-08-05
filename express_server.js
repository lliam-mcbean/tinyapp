//    IMPORTS

const express = require("express");
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const { emailSearch, generateRandomString } = require('./helpers');

//    EXPRESS FUNCTIONALITY

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  maxAge: 1 * 60 * 60 * 1000
}));
app.set('view engine', 'ejs');

//    DATA

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: 'qwerty'
  },
  "sgq3y6": {
    longURL: 'http://www.google.com',
    userID: 'asdfgh'
  }
};

const users = {
  "qwerty": {
    id: "qwerty",
    email: "1@1.com",
    password: bcrypt.hashSync('1', 10)
  },
  "asdfgh": {
    id: "asdfgh",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
  }
};

//    GETS

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls')
  }
  res.redirect('/login');
});

app.get("/urls", (req, res) => {
  const templateVars = {
    user: users,
    user_id: req.session.user_id,
    urls: {}
  };
  for (const keys in urlDatabase) {
    if (urlDatabase[keys].userID === templateVars.user_id) {
      templateVars.urls[keys] = urlDatabase[keys];
    }
  }
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users,
    user_id: req.session.user_id
  };
  if (req.session.user_id) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get('/register', (req, res) => {
  const templateVars = {
    user: users,
    user_id: req.session.user_id
  };
  res.render("urls_register", templateVars);
});

app.get('/login', (req, res) => {
  const templateVars = {
    user: users,
    user_id: req.session.user_id
  };
  res.render('urls_login', templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    user: users,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user_id: req.session.user_id
  };
  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    res.statusCode = 400
    res.redirect('*');
  } else {
    res.render("urls_show", templateVars);
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.statusCode = 404
    res.redirect('*')
  }
});

app.get('*', (req, res) => {
  const templateVars = {
    user: users,
    user_id: req.session.user_id,
    statusCode: req.params.statusCode
  };
  res.render('urls_404', templateVars);
});

app.get('/error/:statusCode', (req, res) => {
  const templateVars = {
    user: users,
    user_id: req.session.user_id,
    statusCode: req.params.statusCode
  };
  res.render('urls_404', templateVars);
});

//   POSTS

app.post("/urls", (req, res) => {
  if (req.session.user_id) {
    const shortUrl = generateRandomString();
    if (!(req.body.longURL).includes('http')) {
      req.body.longURL = 'http://' + req.body.longURL;
    }
    urlDatabase[shortUrl] = {};
    urlDatabase[shortUrl].longURL = req.body.longURL;
    urlDatabase[shortUrl].userID = req.session.user_id;
    res.redirect(`/urls/${shortUrl}`);
  } else {
    res.statusCode = 400
    res.redirect('*')
  }
});

app.post('/urls/:shortURL/delete', (req, res) => {
  if (urlDatabase[req.params.shortURL].userID === req.session.user_id) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  } else {
    res.statusCode = 400
    res.redirect('*')
  }
  
});

app.post('/urls/:shortURL', (req, res) => {
  if (!(req.body.longURL).includes('http')) {
    req.body.longURL = 'http://' + req.body.longURL;
  }
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect(`/urls`);
});

app.post('/login', (req, res) => {
  const user = emailSearch(users, req.body.email);
  if (!user) {
    res.statusCode = 403;
    res.redirect('*');
  } else if (!bcrypt.compareSync(req.body.password, user.password)) {
    res.statusCode = 403;
    res.redirect('*');
  } else {
    req.session.user_id = user.id;
    res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.statusCode = 400;
    res.redirect('*');
  } else if (emailSearch(users, req.body.email)) {
    res.statusCode = 400;
    res.redirect('*');
  } else {
    const newUserId = generateRandomString();
    users[newUserId] = {
      id: newUserId,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };

    req.session.user_id = newUserId;
    res.redirect('/urls');
  }
});

//    SERVER STARTUP

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});