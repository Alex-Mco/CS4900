
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/user');
const axios = require('axios');

let mongoServer;
jest.mock('axios');

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('In-memory MongoDB connected');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  console.log('MongoDB disconnected');
  setTimeout(() => process.exit(), 1000).unref();
});

afterEach(async () => {
  await User.deleteMany();
});
const agent = request.agent(app);
describe('Authenticated Server API tests', () => {
    
    beforeEach(async () => {
        await agent
          .get('/auth/test/fake-login')
          .expect(200); 
    });

    test('should fetch user profile (authenticated)', async () => {
        const res = await agent.get('/profile');
        expect(res.status).toBe(200);
    });

    test('should update user profile', async () => {
        const res = await agent.put('/update-profile').send({ name: 'Updated User', email: 'updated@example.com' });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('name', 'Updated User');
        expect(res.body).toHaveProperty('email', 'updated@example.com');
    });

    test('should logout user', async () => {
        const res = await agent.get('/logout');
        expect(res.status).toBe(302); 

        const afterLogout = await agent.get('/profile');
        expect(afterLogout.status).toBe(401);
    });
});

describe('Unauthenticated Server API tests', () => {
    beforeEach(async () => {
        await agent.get('/logout');
      });

    test('should return a 404 for unknown routes', async () => {
        const res = await agent.get('/unknown-route');
        expect(res.status).toBe(404);
    });

    test('should fetch Marvel comics', async () => {
        axios.get.mockResolvedValue({
        data: {
            data: {
            results: [{ title: 'Spider-Man' }],
            total: 1,
            },
        },
        });

        const res = await agent.get('/api/search?title=Spider-Man');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('results');
        expect(Array.isArray(res.body.results)).toBe(true);
        expect(res.body.results[0]).toHaveProperty('title', 'Spider-Man');
    });

    test('should return error if updating profile without authentication', async () => {
        const res = await agent.put('/update-profile').send({ name: 'New Name' });
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error', 'User not authenticated');
    });

    test('should return an error for missing search query', async () => {
        const res = await agent.get('/api/search');
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'Title query is required');
    });

    test('should allow creating and retrieving a user', async () => {
        const testUser = new User({
        googleId: '123',
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        });
        await testUser.save();

        const foundUser = await User.findOne({ googleId: '123' });
        expect(foundUser).toBeDefined();
        expect(foundUser.name).toBe('Test User');
    });

    test('should return 401 when accessing profile while unauthenticated', async () => {
        const res = await agent.get('/profile');
        expect(res.status).toBe(401); 
    });

    test('should fetch collection details', async () => {
        const testUser = new User({
            googleId: '123',
            username: 'testuser',
            name: 'Test User',
            email: 'test@example.com',
        });
        const collection = { _id: new mongoose.Types.ObjectId(), collectionName: 'testCollection', comics: [] };
        testUser.collections = [collection];
        await testUser.save();

        const res = await agent.get(`/collections/${collection._id}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('_id', collection._id.toString());
    });

    test('should return 404 if collection not found', async () => {
        const res = await agent.get(`/collections/${new mongoose.Types.ObjectId()}`);
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Collection not found');
    });
});


