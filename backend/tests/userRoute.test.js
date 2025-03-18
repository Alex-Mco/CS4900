//ChatGPT helped me by creating an example jest test and giving me functions I can call with jest.
const request = require('supertest');
const express = require('express');
const session = require('express-session')
const userRoutes = require('../routes/userRoutes.js');
const testRoutes = require('../routes/testRoute.js');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const User = require('../models/user.js');
const Comic = require('../models/comic.js');

// Create an Express app instance for testing
const app = express();
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/auth/test', testRoutes);

describe('User API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  //test 1: check existing user
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

  //Test 2: Register a New User
  test('should register a new user', async () => {
    const newUser = {
      googleId: '123456789',
      name: 'Alice',
      email: 'alice@example.com',
      username: 'alice123',
      profilePic: '/default-profile-pic.jpg',
      collections: [],
    };

    User.findOne = jest.fn().mockResolvedValue(null); // Simulate user not existing
    User.prototype.save = jest.fn().mockResolvedValue(newUser); // Simulate saving user

    const res = await request(app)
      .post('/api/users/register')
      .send(newUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('googleId', '123456789');
    expect(res.body).toHaveProperty('name', 'Alice');
    expect(res.body).toHaveProperty('email', 'alice@example.com');
    expect(res.body).toHaveProperty('username', 'alice123');
    expect(res.body).toHaveProperty('profilePic', '/default-profile-pic.jpg');
    expect(res.body.collections).toEqual([]);
  });

  //test 3: adds collection to user
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

  //test 4: Returns a colletion
  test('should return a collection with populated comics', async () => {
    const validCollectionId = new mongoose.Types.ObjectId().toString();

    const mockCollection = {
        _id: validCollectionId,
        collectionName: 'Spiderman Comics',
        comics: [
            { _id: new mongoose.Types.ObjectId().toString(), title: 'Spider-Man', creators: [{ name: 'Stan Lee' }] },
        ],
        toObject: jest.fn().mockReturnValue({
            _id: validCollectionId,
            collectionName: 'Spiderman Comics',
            comics: [
                { _id: new mongoose.Types.ObjectId().toString(), title: 'Spider-Man', creators: [{ name: 'Stan Lee' }] },
            ],
        }),
    };
    const mockUser = {
        _id: '1',
        collections: [mockCollection],
    };
    User.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser),
    });
    const res = await request(app).get(`/api/users/collections/${validCollectionId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('collectionName', 'Spiderman Comics');
    expect(res.body.comics).toHaveLength(1);
    expect(res.body.comics[0]).toHaveProperty('title', 'Spider-Man');
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

  //test 6: deletes comic from a collection
  test('Should delete a comic from collection', async () => {
    const validComicIdOne = new mongoose.Types.ObjectId().toString();
    const validComicIdTwo = new mongoose.Types.ObjectId().toString();
    const user = {
      _id: '1',
      collections: [{_id:'100', collectionName: 'Spiderman Comics', comics: [validComicIdOne, validComicIdTwo]}, { _id: '150', collectionName: 'Avengers Comics', comics: [] }],
      save: jest.fn().mockResolvedValue(true)
    }
    User.findOne = jest.fn().mockResolvedValue(user);
    const res = await request(app).delete(`/api/users/collections/100/comics/${validComicIdOne}`);

    expect(res.status).toBe(200);
    expect(user.collections[0].comics).not.toContain(validComicIdOne);
  });

  //Test 7: Deletes a collection
  test('should delete a collection', async () => {
    const validCollectionId = new mongoose.Types.ObjectId().toString();

    const user = {
        _id: '1',
        collections: [
            { _id: validCollectionId, collectionName: 'Spiderman Comics', comics: [] },
        ],
        save: jest.fn().mockResolvedValue(true),
    };

    User.findOne = jest.fn().mockResolvedValue(user);
    Comic.deleteMany = jest.fn().mockResolvedValue({ acknowledged: true });

    const res = await request(app).delete(`/api/users/collections/${validCollectionId}`);

    expect(res.status).toBe(200);
    expect(User.findOne).toHaveBeenCalled();
    expect(user.collections.some(col => col._id === validCollectionId)).toBe(false);
  });
});


//should add a test for duplicate collection names and make sure that duplicate collection names cannot exsist
// test('should return 400 if collection name already exists', async () => {
//   const mockUser = {
//     _id: '1',
//     collections: [{ collectionName: 'Spiderman Comics' }],
//   };

//   User.findById = jest.fn().mockResolvedValue(mockUser);

//   const res = await request(app)
//     .post('/api/users/1/collections')
//     .send({ collectionName: 'Spiderman Comics' });

//   expect(res.status).toBe(400);
//   expect(res.body).toHaveProperty('msg', 'Collection name already exists');
// });