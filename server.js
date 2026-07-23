const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'DWE@1234';

app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(bodyParser.urlencoded({ extended: false }));

// Serve login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    req.session.authenticated = true;
    return res.redirect('/');
  }
  return res.redirect('/login?error=1');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Protect routes and static assets
app.use((req, res, next) => {
  // Allow access to login page and static assets under /public
  if (req.path === '/login' || req.path === '/logout' || req.path.startsWith('/static') || req.path === '/favicon.ico') return next();
  if (req.session && req.session.authenticated) return next();
  return res.redirect('/login');
});

// Serve static files (CSS/JS/assets)
app.use(express.static(path.join(__dirname)));

// Ensure index and app pages are served
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/app.html', (req, res) => res.sendFile(path.join(__dirname, 'app.html')));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
