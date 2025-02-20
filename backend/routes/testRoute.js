//chatGPT helped me with figuring out mock authentication (proper ways to do it, giving me examples etc.)
//this is a fake route that is only used when testing, it mocks authentication so the real Google Oauth2 is not hit
const express = require('express');
const User = require('../models/user');

const router = express.Router();

router.get('/fake-login', async (req, res, next) => {

  const fakeUser = {
    googleId: '123',
    username: 'testuser',
    name: 'Test User',
    email: 'testuser@example.com',
  };

  try {
    let user = await User.findOne({ googleId: fakeUser.googleId });
    if (!user) {
      user = new User(fakeUser);
      await user.save();
    }

    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      req.session.save(() => { 
        res.json({ message: "Fake user logged in", user });
      });
    });
  } catch (err) {
    res.status(500).json({ error: "Fake login failed" });
  }
});

module.exports = router;
