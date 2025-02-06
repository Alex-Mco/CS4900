//ChatGPT helped me by creating an example jest test and giving me functions I can call with jest.
const request = require('supertest');
const express = require('express');
const userRoutes = require('../routes/userRoutes.js');
const User = require('../models/user.js');
const Comic = require('../models/comic.js');

// Create an Express app instance for testing
const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

// Mock Mongoose models
jest.mock('../models/user');
jest.mock('../models/comic');

describe('User API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  //test 1: new user
  test('should register a new user', async () => {
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
  test('should return 400 if user already exists', async () => {
    User.findOne = jest.fn().mockResolvedValue({ googleId: '12345' });

    const res = await request(app).post('/api/users/register').send({
      googleId: '12345',
      name: 'Alice',
      email: 'alice@example.com',
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('msg', 'User already exists');
  });

  //test 3: updates user info
  test('should update user info', async () => {
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

  //test 4: adds collection to user
  test('should add a collection', async () => {
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

  //test 5: adds comic to user collection
  test('should add comic to collection', async () => {
    const user = {
      _id: '1',
      collections: [{ _id: '100', collectionName: 'Spiderman Comics', comics: [] }, { _id: '150', collectionName: 'Avengers Comics', comics: [] }],
      save: jest.fn().mockResolvedValue(true),
    };

    User.findById = jest.fn().mockResolvedValue(user);

    // Mock Comic save for comic creation (needed for the add comic to collection route)
    const mockComic = {
      _id: '200',
      save: jest.fn().mockResolvedValue(true), 
    };
    Comic.prototype.save = jest.fn().mockResolvedValue(mockComic);

    const res = await request(app)
      .post('/api/users/1/collections/100/comics')
      .send({ title: 'Spider-Man', authors: ['Stan Lee'] });

    expect(res.status).toBe(200);
    expect(user.collections[0].comics).toContain('200');
  });
});
