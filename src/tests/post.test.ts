import request from 'supertest';
import { Express } from 'express';
import mongoose from 'mongoose';
import fs from 'node:fs/promises';
import path from 'path';

import initApp from '../server';
import { type Post, postModel, userModel, type User } from '../models';
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
});

beforeEach(async () => {
  await request(app)
    .post('/users/register')
    .field('username', testUser.username)
    .field('email', testUser.email)
    .field('password', testUser.password)
    .attach('avatar', testUser.avatar);

  const response = await request(app)
    .post('/users/login')
    .send({ username: testUser.username, password: testUser.password });

  const { accessToken, refreshToken } = response.body;
  testUser.accessToken = accessToken;
  testUser.refreshToken = refreshToken;
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
});

afterAll((done) => {
  mongoose.connection.close();
  done();
});

const baseUrl = '/posts';
const testUser: Omit<User, '_id' | 'tokens'> & { refreshToken: string; accessToken: string } = {
  username: 'TestUser',
  email: 'test@user.com',
  password: 'testPassword',
  avatar: 'src/tests/fixtures/profile-picture.png',
  refreshToken: '',
  accessToken: '',
};
const testPost: Required<Pick<Post, 'content' | 'media'>> & Omit<Post, 'userID' | '_id'> = {
  title: 'TestPost',
  content: 'Test content',
  media: 'src/tests/fixtures/profile-picture.png',
};

describe('Post Tests', () => {
  test('Post test post post with only title', async () => {
    const response = await request(app)
      .post(baseUrl)
      .set({ authorization: 'JWT ' + testUser.refreshToken })
      .send({ title: testPost.title });
    expect(response.statusCode).toBe(201);
  });

  test('Post test post post with everything', async () => {
    const response = await request(app)
      .post(baseUrl)
      .set({ authorization: 'JWT ' + testUser.refreshToken })
      .field('title', testPost.title)
      .field('content', testPost.content)
      .attach('media', testPost.media);
    expect(response.statusCode).toBe(201);
  });

  test('Post test fail post post without auth', async () => {
    const response = await request(app)
      .post(baseUrl)
      .field('title', testPost.title)
      .field('content', testPost.content)
      .attach('media', testPost.media);
    expect(response.statusCode).toBe(401);
  });

  test('Post test fail post post without title', async () => {
    const response = await request(app)
      .post(baseUrl)
      .set({ authorization: 'JWT ' + testUser.refreshToken })
      .field('content', testPost.content)
      .attach('media', testPost.media);
    expect(response.statusCode).toBe(400);
  });

  test('Post test fail get posts without auth', async () => {
    await request(app)
      .get(baseUrl)
      .set({ authorization: 'JWT ' + testUser.refreshToken })
      .field('title', testPost.title)
      .field('content', testPost.content)
      .attach('media', testPost.media);

    const response = await request(app).get(baseUrl);
    expect(response.statusCode).toBe(401);
  });

  test('Post test get all posts', async () => {
    await request(app)
      .post(baseUrl)
      .set({ authorization: 'JWT ' + testUser.refreshToken })
      .field('title', testPost.title)
      .field('content', testPost.content)
      .attach('media', testPost.media);

    await request(app)
      .post(baseUrl)
      .set({ authorization: 'JWT ' + testUser.refreshToken })
      .field('title', testPost.title)
      .field('content', testPost.content)
      .attach('media', testPost.media);

    const response = await request(app)
      .get(baseUrl)
      .set({ authorization: 'JWT ' + testUser.refreshToken });
    expect(response.statusCode).toBe(200);
    expect(response.body.posts.length).toBe(2);
  });

  test('Post test get all posts by user id', async () => {
    const newTestUser = { ...testUser };
    newTestUser.username += 'a';

    await request(app)
      .post('/users/register')
      .field('username', newTestUser.username)
      .field('email', newTestUser.email)
      .field('password', newTestUser.password)
      .attach('avatar', newTestUser.avatar);

    let response = await request(app)
      .post('/users/login')
      .send({ username: newTestUser.username, password: newTestUser.password });

    const { accessToken, refreshToken, _id: newTestUserID } = response.body;
    newTestUser.accessToken = accessToken;
    newTestUser.refreshToken = refreshToken;

    await request(app)
      .post(baseUrl)
      .set({ authorization: 'JWT ' + newTestUser.refreshToken })
      .field('title', testPost.title)
      .field('content', testPost.content)
      .attach('media', testPost.media);

    await request(app)
      .post(baseUrl)
      .set({ authorization: 'JWT ' + testUser.refreshToken })
      .field('title', testPost.title)
      .field('content', testPost.content)
      .attach('media', testPost.media);

    response = await request(app)
      .get(`${baseUrl}?userID=${newTestUserID}`)
      .set({ authorization: 'JWT ' + newTestUser.refreshToken });
    expect(response.statusCode).toBe(200);
    expect(response.body.posts.length).toBe(1);
  });

  test('Post test fail get post by id without auth', async () => {
    let response = await request(app)
      .post(baseUrl)
      .set({ authorization: 'JWT ' + testUser.refreshToken })
      .field('title', testPost.title)
      .field('content', testPost.content)
      .attach('media', testPost.media);

    let { _id } = response.body;

    response = await request(app).get(`${baseUrl}/${_id}`);
    expect(response.statusCode).toBe(401);
  });

  test('Post test fail get post by id no such id', async () => {
    let response = await request(app)
      .post(baseUrl)
      .set({ authorization: 'JWT ' + testUser.refreshToken })
      .field('title', testPost.title)
      .field('content', testPost.content)
      .attach('media', testPost.media);

    let { _id } = response.body;

    await request(app)
      .delete(`${baseUrl}/${_id}`)
      .set({ authorization: 'JWT ' + testUser.refreshToken });

    response = await request(app)
      .get(`${baseUrl}/${_id}`)
      .set({ authorization: 'JWT ' + testUser.refreshToken });
    expect(response.statusCode).toBe(404);
  });

  test('Post test get post by id', async () => {
    let response = await request(app)
      .post(baseUrl)
      .set({ authorization: 'JWT ' + testUser.refreshToken })
      .field('title', testPost.title)
      .field('content', testPost.content)
      .attach('media', testPost.media);

    let { _id } = response.body;

    response = await request(app)
      .get(`${baseUrl}/${_id}`)
      .set({ authorization: 'JWT ' + testUser.refreshToken });
    expect(response.statusCode).toBe(200);
  });

  test('Post test fail update post without auth', async () => {
    let response = await request(app)
      .post(baseUrl)
      .set({ authorization: 'JWT ' + testUser.refreshToken })
      .field('title', testPost.title)
      .field('content', testPost.content)
      .attach('media', testPost.media);

    let { _id } = response.body;

    response = await request(app).get(`${baseUrl}/${_id}`);

    expect(response.statusCode).toBe(401);
  });

  test('Post test update post', async () => {
    let response = await request(app)
      .post(baseUrl)
      .set({ authorization: 'JWT ' + testUser.refreshToken })
      .field('title', testPost.title)
      .field('content', testPost.content)
      .attach('media', testPost.media);

    let { _id, media: oldMedia } = response.body;

    const updatedPost: typeof testPost = {
      title: testPost.title + 'a',
      content: testPost.content + 'a',
      media: testPost.media,
    };

    response = await request(app)
      .put(`${baseUrl}/${_id}`)
      .set({ authorization: 'JWT ' + testUser.refreshToken })
      .field('title', updatedPost.title)
      .field('content', updatedPost.content)
      .attach('media', updatedPost.media);
    expect(response.statusCode).toBe(200);

    response = await request(app)
      .get(`${baseUrl}/${_id}`)
      .set({ authorization: 'JWT ' + testUser.refreshToken });
    expect(response.body.media).not.toBe(oldMedia);
    expect(response.body.content).toBe(updatedPost.content);
    expect(response.body.title).toBe(updatedPost.title);
  });

  test('Post test fail delete post without auth', async () => {
    let response = await request(app)
      .post(baseUrl)
      .set({ authorization: 'JWT ' + testUser.refreshToken })
      .field('title', testPost.title)
      .field('content', testPost.content)
      .attach('media', testPost.media);

    let { _id } = response.body;

    response = await request(app).delete(`${baseUrl}/${_id}`);

    expect(response.statusCode).toBe(401);
  });

  test('Post test fail delete post not exist', async () => {
    let response = await request(app)
      .post(baseUrl)
      .set({ authorization: 'JWT ' + testUser.refreshToken })
      .field('title', testPost.title)
      .field('content', testPost.content)
      .attach('media', testPost.media);

    let { _id } = response.body;

    let idSuffixCode = _id.slice(-1).charCodeAt(0);
    const idPrefix = _id.slice(0, -1);

    if (48 <= idSuffixCode && idSuffixCode <= 57) {
      if (idSuffixCode === 57) {
        idSuffixCode = 65;
      } else {
        idSuffixCode += 1;
      }
    }

    if (65 <= idSuffixCode && idSuffixCode <= 90) {
      if (idSuffixCode === 90) {
        idSuffixCode = 97;
      } else {
        idSuffixCode += 1;
      }
    }

    if (97 <= idSuffixCode && idSuffixCode <= 102) {
      if (idSuffixCode === 102) {
        idSuffixCode = 48;
      } else {
        idSuffixCode += 1;
      }
    }
    response = await request(app)
      .delete(`${baseUrl}/${idPrefix + String.fromCharCode(idSuffixCode)}`)
      .set({ authorization: 'JWT ' + testUser.refreshToken });

    expect(response.statusCode).toBe(404);
  });

  test('Post test delete post', async () => {
    let response = await request(app)
      .post(baseUrl)
      .set({ authorization: 'JWT ' + testUser.refreshToken })
      .field('title', testPost.title)
      .field('content', testPost.content)
      .attach('media', testPost.media);

    let { _id } = response.body;

    response = await request(app)
      .delete(`${baseUrl}/${_id}`)
      .set({ authorization: 'JWT ' + testUser.refreshToken });

    expect(response.statusCode).toBe(200);

    response = await request(app)
      .get(baseUrl)
      .set({ authorization: 'JWT ' + testUser.refreshToken });
    expect(response.body.posts.length).toBe(0);
  });
});
