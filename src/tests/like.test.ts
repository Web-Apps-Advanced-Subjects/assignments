import request from 'supertest';
import { Express } from 'express';
import mongoose, { Types } from 'mongoose';
import fs from 'node:fs/promises';
import path from 'path';

import initApp from '../server';
import { type Post, postModel, userModel, type User, type Like, likeModel } from '../models';
import { title } from 'node:process';

let app: Express;

beforeAll(async () => {
  app = await initApp();
  const dirs = ['public/avatars', 'public/media'];

  for (const dir of dirs) {
    for (const file of await fs.readdir(dir)) {
      if (file !== '.gitkeep') {
        await fs.unlink(path.join(dir, file));
      }
    }
  }

  await userModel.deleteMany();
  await postModel.deleteMany();
  await likeModel.deleteMany();
});

beforeEach(async () => {
  await request(app)
    .post('/users/register')
    .field('username', testUser.username)
    .field('email', testUser.email)
    .field('password', testUser.password)
    .attach('avatar', testUser.avatar);

  let response = await request(app)
    .post('/users/login')
    .send({ username: testUser.username, password: testUser.password });

  const { accessToken, refreshToken } = response.body;
  testUser.accessToken = accessToken;
  testUser.refreshToken = refreshToken;

  response = await request(app)
    .post('/posts')
    .set({ authorization: 'JWT ' + testUser.refreshToken })
    .field('title', testPost.title)
    .field('content', testPost.content)
    .attach('media', testPost.media);
  const { _id } = response.body;
  testPost._id = _id;
});

afterEach(async () => {
  const dirs = ['public/avatars', 'public/media'];

  for (const dir of dirs) {
    for (const file of await fs.readdir(dir)) {
      if (file !== '.gitkeep') {
        await fs.unlink(path.join(dir, file));
      }
    }
  }

  await userModel.deleteMany();
  await postModel.deleteMany();
  await likeModel.deleteMany();
});

afterAll((done) => {
  mongoose.connection.close();
  done();
});

const baseUrl = '/likes';
const testUser: Omit<User, '_id' | 'tokens'> & { refreshToken: string; accessToken: string } = {
  username: 'TestUser',
  email: 'test@user.com',
  password: 'testPassword',
  avatar: 'src/tests/fixtures/profile-picture.png',
  refreshToken: '',
  accessToken: '',
};
const testPost: Required<Pick<Post, 'content' | 'media'>> & Omit<Post, 'userID'> = {
  title: 'TestPost',
  content: 'Test content',
  media: 'src/tests/fixtures/profile-picture.png',
  _id: '' as unknown as Types.ObjectId,
};

describe('Like Tests', () => {
  test('Like test fail get is liked without auth', async () => {
    const response = await request(app).get(`${baseUrl}/${testPost._id}`);
    expect(response.statusCode).toBe(401);
  });

  test('Like test get is liked', async () => {
    let response = await request(app)
      .get(`${baseUrl}/${testPost._id}`)
      .set({ authorization: 'JWT ' + testUser.refreshToken });
    expect(response.body.liked).toBe(false);

    await request(app)
      .post(`${baseUrl}/${testPost._id}`)
      .set({ authorization: 'JWT ' + testUser.refreshToken });

    response = await request(app)
      .get(`${baseUrl}/${testPost._id}`)
      .set({ authorization: 'JWT ' + testUser.refreshToken });
    expect(response.body.liked).toBe(true);
  });

  test('Like test fail like post without auth', async () => {
    await request(app)
      .post(`${baseUrl}/${testPost._id}`)
      .set({ authorization: 'JWT ' + testUser.refreshToken });
    const response = await request(app)
      .post(`${baseUrl}/${testPost._id}`)
      .set({ authorization: 'JWT ' + testUser.refreshToken });
    expect(response.statusCode).toBe(409);
  });

  test('Like test like post', async () => {
    const response = await request(app)
      .post(`${baseUrl}/${testPost._id}`)
      .set({ authorization: 'JWT ' + testUser.refreshToken });
    expect(response.statusCode).toBe(201);
  });

  test('Like test fail delete like without auth', async () => {
    let response = await request(app).delete(`${baseUrl}/${testPost._id}`);
    expect(response.statusCode).toBe(401);
  });

  test('Like test fail delete like not exist', async () => {
    let response = await request(app)
      .delete(`${baseUrl}/${testPost._id}`)
      .set({ authorization: 'JWT ' + testUser.refreshToken });
    expect(response.statusCode).toBe(404);
  });

  test('Like test delete like', async () => {
    await request(app)
      .post(`${baseUrl}/${testPost._id}`)
      .set({ authorization: 'JWT ' + testUser.refreshToken });
    let response = await request(app)
      .delete(`${baseUrl}/${testPost._id}`)
      .set({ authorization: 'JWT ' + testUser.refreshToken });
    expect(response.statusCode).toBe(200);
  });
});
