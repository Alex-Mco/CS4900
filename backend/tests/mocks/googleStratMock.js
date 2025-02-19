//chatGPT helped me with figuring out mock authentication (proper ways to do it, giving me examples etc.)
//this just mocks the google authentication callback so I do not have to actually use the real callback for testing
const passport = require('passport');
const util = require('util');

function MockStrategy(options, verify) {
  this.name = 'google';
  this.verify = verify;
}

MockStrategy.prototype.authenticate = function (req) {
    const fakeProfile = {
        id: '1234567890',
        displayName: 'Test User',
        emails: [{ value: 'testuser@example.com' }],
        photos: [{ value: 'https://example.com/avatar.png' }],
    };

    const self = this;
    function done(err, user) {
        if (err) {
        return self.error(err);
        }
        self.success(user);
    }

    this.verify(null, null, fakeProfile, done);
};

util.inherits(MockStrategy, passport.Strategy);

module.exports = MockStrategy;
