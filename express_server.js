const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())
app.set('view engine', 'ejs')

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: 'qwerty'
  },
  "sgq3y6": {
    longURL: 'http://www.google.com',
    userID: 'asdfgh'
  }
}

const users = { 
  "qwerty": {
    id: "qwerty", 
    email: "1@1.com", 
    password: "1"
  },
 "asdfgh": {
    id: "asdfgh", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

const generateRandomString = () => {
  let randomString = ''
  randomString += Math.random().toString(20).substr(2, 6)
  return randomString
}

const emailSearch = (db, email) => {
  for (const user in db) {
    if (email === db[user].email) {
      return db[user]
    }
  }
  return false
}



app.get("/", (req, res) => {
  res.redirect('/urls');
});

app.get("/urls", (req, res) => {
  const templateVars = { 
    user: users,
    user_id: req.cookies['user_id'], 
    urls: {}
  }
  for (const keys in urlDatabase) {
    if (urlDatabase[keys].userID === templateVars.user_id) {
      templateVars.urls[keys] = urlDatabase[keys]
    }
  }
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users,
    user_id: req.cookies['user_id']
  }
  if (req.cookies['user_id']) {
    res.render("urls_new", templateVars)
  } else {
    res.redirect('/login')
  }
});

app.get('/register', (req, res) => {
  const templateVars = {
    user: users,
    user_id: req.cookies['user_id']
  }
  res.render("urls_register", templateVars);
})

app.get('/login', (req, res) => {
  const templateVars = {
    user: users,
    user_id: req.cookies['user_id']
  }
  res.render('urls_login', templateVars)
})

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    user: users,
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL].longURL,
    user_id: req.cookies['user_id']
  };
  if (req.cookies['user_id'] !== urlDatabase[req.params.shortURL].userID) {
    res.redirect('/error/404')
  }

  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL
  res.redirect(longURL);
});

app.get('*', (req, res) => {
  const templateVars = {
    user: users,
    user_id: req.cookies['user_id'],
    statusCode: req.params.statusCode
  }
  res.render('urls_404', templateVars)
})

app.get('/error/:statusCode', (req, res) => {
  const templateVars = {
    user: users,
    user_id: req.cookies['user_id'],
    statusCode: req.params.statusCode
  }
  res.render('urls_404', templateVars)
})

app.post("/urls", (req, res) => {
  const shortUrl = generateRandomString()
  if (!(req.body.longURL).includes('http')) {
    req.body.longURL = 'http://' + req.body.longURL;
  }
  urlDatabase[shortUrl] = {}
  urlDatabase[shortUrl].longURL = req.body.longURL 
  urlDatabase[shortUrl].userID = req.cookies['user_id']
  res.redirect(`/urls/${shortUrl}`);        
});

app.post('/urls/:shortURL/delete', (req, res) => {
  if (urlDatabase[req.params.shortURL].userID === req.cookies['user_id']) {
    delete urlDatabase[req.params.shortURL]
  }
  res.redirect('/urls')
})

app.post('/urls/:shortURL', (req, res) => {
  if (!(req.body.longURL).includes('http')) {
    req.body.longURL = 'http://' + req.body.longURL;
  }
  urlDatabase[req.params.shortURL].longURL = req.body.longURL
  res.redirect(`/urls/${req.params.shortURL}`)
})

app.post('/login', (req, res) => {
  const user = emailSearch(users, req.body.email)
  if (!user) {
    res.statusCode = 403
    res.redirect('/login')
  }
  if (user.password !== req.body.password) {
    res.statusCode = 403
    res.redirect('/login')
  }
  res.cookie('user_id', user.id)
  res.redirect('/urls')
})

app.post('/logout', (req, res) => {
  res.clearCookie('user_id')
  res.redirect('/urls')
})

app.post('/register', (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.statusCode = 400
    res.redirect('/register')
  } else if (emailSearch(users, req.body.email)) {
    res.statusCode = 400
    res.redirect('/register')
  } else {
    const newUserId = generateRandomString()
    users[newUserId] = {
      id: newUserId,
      email: req.body.email,
      password: req.body.password
    }

    res.cookie('user_id', newUserId)
    res.redirect('/urls')
  }
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});