const request = require('supertest');
const express = require('express');
const userRoutes = require('../database/routes/userRoutes.js');
const User = require('../database/models/user');
const Comic = require('../database/models/comic.js');

// Create an Express app instance for testing
const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

// Mock Mongoose models
jest.mock('../database/models/user');
jest.mock('../database/models/comic');  // Just mock Comic where necessary

describe('User API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test
  });

  //test 1: new user
  it('should register a new user', async () => {
    const newUser = {
      googleId: '12345',
      name: 'Alice',
      email: 'alice@example.com',
      profilePic: 'profile.jpg',
    };

    User.findOne = jest.fn().mockResolvedValue(null);
    User.prototype.save = jest.fn().mockResolvedValue({ _id: '1', ...newUser });
    const res = await request(app).post('/api/users/register').send(newUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('name', 'Alice');
  });

  //test 2: check existing user
  it('should return 400 if user already exists', async () => {
    User.findOne = jest.fn().mockResolvedValue({ googleId: '12345' });

    const res = await request(app).post('/api/users/register').send({
      googleId: '12345',
      name: 'Alice',
      email: 'alice@example.com',
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('msg', 'User already exists');
  });

  //test 3: returns all users
  it('should return all users', async () => {
    User.find = jest.fn().mockResolvedValue([
      { _id: '1', name: 'Alice' },
      { _id: '2', name: 'Bob' },
    ]);

    const res = await request(app).get('/api/users');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toHaveProperty('name', 'Alice');
  });

  //test 4: updates user info
  it('should update user info', async () => {
    const updatedUser = { name: 'Alice Updated' };
    User.findOneAndUpdate = jest.fn().mockResolvedValue({
      _id: '1',
      googleId: '123456789',
      name: 'Alice Updated',
      email: 'alice@example.com',
    });

    const res = await request(app)
      .put('/api/users/update/12345')
      .send(updatedUser);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', 'Alice Updated');
  });

  //test 5: adds collection to user
  it('should add a collection', async () => {
    const user = {
      _id: '1',
      collections: [],
      save: jest.fn().mockResolvedValue(true),
    };

    User.findById = jest.fn().mockResolvedValue(user);

    const res = await request(app)
      .post('/api/users/1/collections')
      .send({ collectionName: 'My Comics' });

    expect(res.status).toBe(200);
    expect(user.collections).toHaveLength(1);
  });

  //test 6: adds comic to user collection
  it('should add comic to collection', async () => {
    const user = {
      _id: '1',
      collections: [{ _id: '100', collectionName: 'Spiderman Comics', comics: [] }, { _id: '150', collectionName: 'Avengers Comics', comics: [] }],
      save: jest.fn().mockResolvedValue(true),
    };

    User.findById = jest.fn().mockResolvedValue(user);

    // Mock Comic save for comic creation (needed for the add comic to collection route)
    const mockComic = {
      _id: '200',  // The new comic ID
      save: jest.fn().mockResolvedValue(true), // Return resolved value when save is called
    };
    Comic.prototype.save = jest.fn().mockResolvedValue(mockComic);

    const res = await request(app)
      .post('/api/users/1/collections/100/comics')
      .send({ title: 'Spider-Man', authors: ['Stan Lee'] });

    expect(res.status).toBe(200);
    expect(user.collections[0].comics).toContain('200');  // Check if comic ID is added to collection
  });
});
