const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())
app.set('view engine', 'ejs')

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
}

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "1@1.com", 
    password: "1"
  },
 "user2RandomID": {
    id: "user2RandomID", 
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
    urls: urlDatabase
  }
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users,
    user_id: req.cookies['user_id']
  }
  res.render("urls_new", templateVars);
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
    longURL: urlDatabase[req.params.shortURL],
    user_id: req.cookies['user_id']
  };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL);
});

app.get('*', (req, res) => {
  const templateVars = {
    user: users,
    user_id: req.cookies['user_id']
  }
  res.render('urls_404', templateVars)
})

app.post("/urls", (req, res) => {
  const shortUrl = generateRandomString()
  urlDatabase[shortUrl] = req.body.longURL  
  res.redirect(`/urls/${shortUrl}`);        
});

app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL]
  res.redirect('/urls')
})

app.post('/urls/:shortURL', (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL
  res.redirect(`/urls/${req.params.shortURL}`)
})

app.post('/login', (req, res) => {
  const user = emailSearch(users, req.body.email)
  if (!user) {
    res.send('Error on login. user not found')
  }

  res.cookie('user', req.body.user)
  res.redirect('/urls')
})

app.post('/logout', (req, res) => {
  res.clearCookie('user_id')
  res.redirect('/urls')
})

app.post('/register', (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.statusCode = 400
    res.end()
  } else if (!emailSearch(users, req.body.email)) {
    res.statusCode = 400
    res.end()
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
  console.log(users)
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});