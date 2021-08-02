const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs')

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const generateRandomString = () => {
    let randomString = ''
    randomString += Math.random().toString(20).substr(2, 6)
    return randomString
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.post("/urls", (req, res) => {
    const shortUrl = generateRandomString()
    urlDatabase[shortUrl] = req.body.longURL  // Log the POST request body to the console
    res.redirect(`/urls/${shortUrl}`);         // Respond with 'Ok' (we will replace this)
});

app.get("/urls/new", (req, res) => {
    res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:shortURL", (req, res) => {
    const longURL = urlDatabase[req.params.shortURL]
    res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});