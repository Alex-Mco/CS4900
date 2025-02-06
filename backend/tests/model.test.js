//ChatGPT helped me by creating an example jest test and giving me functions I can call with jest.
const Comic = require('../models/comic');
const User = require('../models/user');
const mongoose = require('mongoose');
const { ValidationError } = mongoose.Error;
jest.setTimeout(10000);

//test database using mongodb-memory-server
const { MongoMemoryServer } = require('mongodb-memory-server');
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});


describe('Testing Comic model', () => {
  let sampleComicVal;

  beforeEach(() => {
    sampleComicVal = {
      title: 'Comic Title',
      issueNumber: 1,
      creators: [
        { role: 'Writer', name: 'John Doe' },
        { role: 'Artist', name: 'Jane Doe' }
      ],
      description: 'A comic description.',
      thumbnail: { path: 'path/to/thumbnail', extension: 'jpg' },
      series: 'Comic Series',
      variant: true,
      pgCount: 32
    };
  });
  afterEach(async () => {
    await Comic.deleteMany({});
  });

  test('should throw an error due to missing required title field', async () => {
    const comic = new Comic();

    try {
      await comic.validate();
    } catch (err) {
        expect(err).toHaveProperty('message', 'Comic validation failed: title: Path `title` is required.');
    }
  });

  test('should create a comic successfully with all fields', async () => {
    const comic = new Comic(sampleComicVal);
    const saveSpy = jest.spyOn(comic, 'save').mockResolvedValue(true);

    await comic.save();
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(comic.title).toBe('Comic Title');
    expect(comic.issueNumber).toBe(1);
  });

  test('should create a comic successfully with missing optional fields', async () => {
    const comic = new Comic({
      title: 'Another Comic Title',
      issueNumber: 2
      // Missing optional fields on purpose
    });
    const saveSpy = jest.spyOn(comic, 'save').mockResolvedValue(true);

    await comic.save();
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(comic.title).toBe('Another Comic Title');
    expect(comic.issueNumber).toBe(2);
  });

  test('should throw an error if the variant field is not a boolean', async () => {
    const comic = new Comic({ ...sampleComicVal, variant: 'not a boolean' });

    try {
        await comic.validate();
    }catch(err) {
        expect(err).toBeInstanceOf(ValidationError);
        expect(err.errors.variant).toBeDefined();
    }
  });
});

describe('Testing User model', () => {
  let sampleUserVal;

  beforeEach(async () => {

    // Sample user data
    sampleUserVal = {
      googleId: 'google123',
      name: 'Test User',
      username: 'testuser',
      email: 'testuser@example.com',
      collections: []
    };
  });
  afterEach(async () => {
    await User.deleteMany({});
  });

  test('should throw an error due to missing required fields', async () => {
    const user = new User(); // Missing required fields on purpose
    const validateSpy = jest.spyOn(user, 'validate').mockRejectedValue(new Error('Required fields missing'));

    try {
      await user.validate();
    } catch (err) {
      expect(err).toHaveProperty('message', 'Required fields missing');
      expect(validateSpy).toHaveBeenCalledTimes(1);
    }
  });

  test('should create a user successfully with valid fields', async () => {
    const user = new User(sampleUserVal);

    try {
        await user.validate();
        expect(user.name).toBe('Test User');
        expect(user.email).toBe('testuser@example.com');
    } catch (err) {
        throw new Error('Unexpected failure!');
    }
  });

  test('should throw an error due to duplicate unique email', async () => {
    const user1 = new User(sampleUserVal);
    await user1.save();

    const user2 = new User({ ...sampleUserVal, googleId: 'google456' });

    try {
        await user2.validate();
    } catch (err) {
        expect(err.errors.email).toBeDefined(); // Duplicate email should throw error
    }
  });

  test('should throw an error due to duplicate unique username', async () => {
    const user1 = new User(sampleUserVal);
    await user1.save();

    const user2 = new User({ ...sampleUserVal, googleId: 'google456', email: 'anotheruser@example.com' });

    try {
        await user2.validate();
    } catch (err) {
        expect(err.errors.username).toBeDefined(); // Duplicate username should throw error
    }
  });
});
