
//    IMPORTS

const express = require("express");
const methodOverride = require('method-override');
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080;

// HELPER FUNCTIONS

const { emailSearch, generateRandomString } = require('./helpers');

// DATA

const { urlDatabase } = require('./data/data');

// USERS

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

//    EXPRESS FUNCTIONALITY

app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  maxAge: 1 * 60 * 60 * 1000
}));
app.set('view engine', 'ejs');

//    GET REQUESTS

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  }
  res.redirect('/login');
});

app.get("/urls", (req, res) => {
  const templateVars = {
    user: users,
    user_id: req.session.user_id,
    urls: {}
  };
  // looping through the objects in our database to validate userID
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
  if (urlDatabase[req.params.shortURL]) {
    // sending all the parameters to our edit page. site visits and unique visitors refer to stretch
    const templateVars = {
      user: users,
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user_id: req.session.user_id,
      visits: urlDatabase[req.params.shortURL].visits,
      visitors: urlDatabase[req.params.shortURL].visitors.length
    };
    if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
      res.statusCode = 400;
      res.redirect('*');
    } else {
      res.render("urls_show", templateVars);
    }
  } else {
    res.statusCode = 404;
    res.redirect('/*');
  }

});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:shortURL", (req, res) => {
  if (!req.session.user_id) {
    req.session.user_id = generateRandomString();
  }
  const visitors = urlDatabase[req.params.shortURL].visitors;
  if (urlDatabase[req.params.shortURL]) {
    // add unique visitors to our visitors array within our shortURL object (stretch)
    if (visitors.length === 0) {
      visitors.push(req.session.user_id);
    }

    for (let i = 0; i < visitors.length; i++) {
      if (req.session.user_id === visitors[i]) {
        break;
      } else if (i === visitors.length - 1) {
        visitors.push(req.session.user_id);
      }
    }

    const longURL = urlDatabase[req.params.shortURL].longURL;
    urlDatabase[req.params.shortURL].visits += 1;
    res.redirect(longURL);
  } else {
    res.statusCode = 404;
    res.redirect('*');
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

//   POST REQUESTS

app.post("/urls", (req, res) => {
  if (req.session.user_id) {
    const shortUrl = generateRandomString();
    if (!(req.body.longURL).includes('http')) {
      req.body.longURL = 'http://' + req.body.longURL;
    }
    urlDatabase[shortUrl] = {};
    urlDatabase[shortUrl].longURL = req.body.longURL;
    urlDatabase[shortUrl].userID = req.session.user_id;
    urlDatabase[shortUrl].visits = 0;
    urlDatabase[shortUrl].visitors = [];
    res.redirect(`/urls/${shortUrl}`);
  } else {
    res.statusCode = 400;
    res.redirect('*');
  }
});

app.post('/urls/:shortURL/delete', (req, res) => {
  if (urlDatabase[req.params.shortURL].userID === req.session.user_id) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  } else {
    res.statusCode = 400;
    res.redirect('*');
  }
  
});

app.post('/urls/:shortURL', (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
    if (!(req.body.longURL).includes('http')) {
      req.body.longURL = 'http://' + req.body.longURL;
    }
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect(`/urls`);
  } else {
    res.statusCode = 404;
    res.redirect('*');
  }
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
  req.session['user_id'] = null;
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