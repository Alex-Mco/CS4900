//this file uses the real google strat if not in testing mode and then if in testing mode it uses the mocked strat I made.
const passport = require('passport');
const User = require('./models/user');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MockStrategy = require('./tests/mocks/googleStratMock');
require('dotenv').config();

const isTest = process.env.NODE_ENV === 'test';

if (isTest) {
  passport.use(
    new MockStrategy(async (accessToken, refreshToken, profile, done) => {
      try {
        const mockProfile = {
          id: "test123",
          displayName: "Test User",
          emails: [{ value: "testuser@example.com" }],
          photos: [{ value: "https://example.com/test-profile-pic.png" }]
        };

        return done(null, mockProfile);
      } catch (err) {
        console.error('Error in Mock Strategy:', err.message);
        return done(err, null);
      }
    })
  );
} else {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: 'process.env.REACT_APP_BACK_URL/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
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
      }
    )
  );
}

// Ensure no two users have the same username
const generateUniqueUsername = async (emailPrefix) => {
  let username = emailPrefix;
  let count = 1;

  while (await User.findOne({ username })) {
    username = `${emailPrefix}${count}`;
    count++;
  }

  return username;
};

passport.serializeUser((user, done) => {
  done(null, user.googleId);
});

passport.deserializeUser(async (googleId, done) => {
  try {
    const user = await User.findOne({ googleId });
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});



module.exports = passport;
