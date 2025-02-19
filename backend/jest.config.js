module.exports = {
    testEnvironment: 'node', // Ensure Node.js environment for backend
    testMatch: ['<rootDir>/tests/**/*.test.js'], // Only run backend tests
    transform: {}, // Avoid Babel transform issues
};
  