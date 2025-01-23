const passport = require('passport');
const User = require('./database/models/user');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:5000/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if the user already exists in the database
    const existingUser = await User.findOne({ googleId: profile.id });
    if (existingUser) {
      return done(null, existingUser); // If the user exists, pass it to the session
    } 
    // If the user doesn't exist, create a new user with Google profile information
    const username = await generateUniqueUsername(profile.emails[0].value.split('@')[0]);
    const newUser = new User({
      googleId: profile.id,
      username: username, 
      name: profile.displayName,
      email: profile.emails[0].value, 
      profilePic: profile.photos[0].value, 
      collections: [], 
    });

    await newUser.save();
    return done(null, newUser);
  } catch (err) {
    console.error('Error during Google OAuth login:', err.message);
    return done(err, null);
  }
}));

// to insure no two users have the same username
const generateUniqueUsername = async (emailPrefix) => {
  let username = emailPrefix;
  let count = 1;

  while (await User.findOne({ username })) {
    username = `${emailPrefix}${count}`;
    count++;
  }

  return username;
};

// Serialize the user into the session
passport.serializeUser((user, done) => {
  done(null, user.googleId); 
});

// Deserialize the user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const googleId = id

    const user = await User.findOne({ googleId: googleId });
    if (!user) {
      console.log('User not found');
      return done(null, false);
    }
    done(null, user);
  } catch (err) {
    console.error('Error during deserialization:', err);
    done(err, null);
  }
});
