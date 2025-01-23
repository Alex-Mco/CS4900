const express = require('express');
const passport = require('passport');
const session = require('express-session');
const app = express();

app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Routes
const authRoutes = require('./authRoutes');
app.use('/auth', authRoutes);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
