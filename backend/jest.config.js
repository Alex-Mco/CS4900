module.exports = {
    testEnvironment: 'node', // Ensure Node.js environment for backend
    testMatch: ['<rootDir>/backend/tests/**/*.test.js'], // Only run backend tests
    transform: {}, // Avoid Babel transform issues
};
  