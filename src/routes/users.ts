import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

import { usersController } from '../controllers';
import { authenticate } from '../middleware';
import { type User } from '../models';

const asyncUnlink = promisify(fs.unlink);
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/avatars/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); //Appending extension
  },
});
const upload = multer({ storage: storage });
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: The Users API
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     BaseUser:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *           description: The user username
 *         password:
 *           type: string
 *           description: The user password
 *       example:
 *         username: 'bob'
 *         password: 'pass'
 *     BaseRestUser:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           description: The user email
 *         avatar:
 *           type: string
 *           format: binary
 *           description: The user avatar picture
 *       example:
 *         email: 'bob@gmail.com'
 *         avatar: 123.png
 *     PartialUser:
 *       allOf:
 *       - $ref: '#/components/schemas/BaseUser'
 *       - $ref: '#/components/schemas/BaseRestUser'
 *     User:
 *       allOf:
 *       - $ref: '#/components/schemas/PartialUser'
 *       required:
 *         - username
 *         - password
 *         - email
 *         - avatar
 *     DBUser:
 *       allOf:
 *       - $ref: '#/components/schemas/User'
 *       - $ref: '#/components/schemas/UserID'
 *       - type: object
 *         required:
 *           - _id
 *           - tokens
 *         properties:
 *           _id:
 *             type: string
 *             description: The user id
 *           tokens:
 *             type: array
 *             items:
 *               type: string
 *               description: The user access tokens
 *         example:
 *           _id: '6777cbe51ead7054a6a78d74'
 *           tokens: ['eyJfaWQiOiI2Nzc3Y2JlNTFlYWQ3MDU0YTZh']
 *     UserID:
 *       type: object
 *       required:
 *         - _id
 *       properties:
 *         _id:
 *           type: string
 *           description: The user id
 *       example:
 *         _id: '6777cbe51ead7054a6a78d74'
 *     RefreshToken:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: The user generated refresh token
 *       example:
 *         refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: registers a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: The new user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DBUser'
 *       400:
 *         description: Missing arguments/Bad avatar file format
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       409:
 *         description: Username taken
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

router.post('/register', upload.single('avatar'), async (req, res) => {
  const { username, password, email } = req.body;
  const file = req.file;

  if (
    username === undefined ||
    password === undefined ||
    email === undefined ||
    file === undefined
  ) {
    if (file !== undefined) {
      await asyncUnlink(file.path);
    }

    res.status(400).send('Missing Arguments');
    return;
  }

  if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpeg') {
    await asyncUnlink(file.path);

    res.status(400).send('File Type Unsupported');
    return;
  }

  try {
    let user = await usersController.findOneByUsername(username);

    if (user !== null) {
      await asyncUnlink(file.path);

      res.status(409).send('Username Taken');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const avatar = file.path.replaceAll(path.sep, path.posix.sep);
    user = await usersController.create({
      username,
      password: hashedPassword,
      email,
      avatar,
      tokens: [],
    });

    res.status(201).send(user);
  } catch (err) {
    await asyncUnlink(file.path);

    throw err;
  }
});

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: login to existing user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BaseUser'
 *     responses:
 *       200:
 *         description: User session credentials
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *               - $ref: '#/components/schemas/UserID'
 *               - $ref: '#/components/schemas/RefreshToken'
 *               - type: object
 *                 required:
 *                   - accessToken
 *                 properties:
 *                   accessToken:
 *                     type: string
 *                     description: The user generated access token
 *                 example:
 *                   accessToken: 'eyJfaWQiOiI2Nzc3Y2JlNTFlYWQ3MDU0YTZh'
 *       400:
 *         description: Missing arguments
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       401:
 *         description: Authentication failed
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (username === undefined || password === undefined) {
    res.status(400).send('Missing Arguments');
    return;
  }

  const user = await usersController.findOneByUsername(username);

  if (user === null) {
    res.status(401).json({ error: 'Authentication failed' });
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    res.status(401).json({ error: 'Authentication failed' });
    return;
  }

  const { accessToken, refreshToken } = usersController.generateTokens(user._id);
  user.tokens.push(refreshToken);
  await user.save();

  res.status(200).send({ accessToken, refreshToken, _id: user._id });
});

/**
 * @swagger
 * /users/logout:
 *   post:
 *     summary: logout of user account
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshToken'
 *     responses:
 *       200:
 *         description: Successfully logged out of session
 *       400:
 *         description: Missing arguments
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       403:
 *         description: Authentication failed
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken === undefined) {
    res.sendStatus(400);
    return;
  }

  try {
    const user = await usersController.verifyRefreshToken(refreshToken);

    res.sendStatus(200);
  } catch (err) {
    res.status(403).send('Invalid Request');
  }
});

/**
 * @swagger
 * /users/refresh-token:
 *   post:
 *     summary: refresh user refreshToken
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshToken'
 *     responses:
 *       200:
 *         description: User session credentials
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *               - $ref: '#/components/schemas/UserID'
 *               - $ref: '#/components/schemas/RefreshToken'
 *               - type: object
 *                 required:
 *                   - accessToken
 *                 properties:
 *                   accessToken:
 *                     type: string
 *                     description: The user generated access token
 *                 example:
 *                   accessToken: 'eyJfaWQiOiI2Nzc3Y2JlNTFlYWQ3MDU0YTZh'
 *       400:
 *         description: Missing arguments
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       403:
 *         description: Authentication failed
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

router.post('/refresh-token', async (req, res) => {
  const { refreshToken: oldRefreshToken } = req.body;

  if (oldRefreshToken === undefined) {
    res.sendStatus(400);
    return;
  }

  try {
    const user = await usersController.verifyRefreshToken(oldRefreshToken);
    const { accessToken, refreshToken: newRefreshToken } = usersController.generateTokens(user._id);

    user.tokens.push(newRefreshToken);
    await user.save();

    res.status(200).send({ accessToken, refreshToken: newRefreshToken, _id: user._id });
  } catch (err) {
    res.status(403).send('Invalid Request');
  }
});

/**
 * @swagger
 * /users:
 *   put:
 *     summary: Update user username and/or avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: New username
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: New avatar
 *     responses:
 *       200:
 *         description: User session credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DBUser'
 *       400:
 *         description: Missing arguments
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       401:
 *         description: Not authenticated
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       409:
 *         description: Username taken
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

router.put('/', authenticate, upload.single('avatar'), async (req, res) => {
  const { username } = req.body;
  const file = req.file;
  // @ts-expect-error "user" was patched to the req object from the auth middleware
  const userID = req.user._id;
  const params: Partial<User> = {};

  if (username === undefined && file === undefined) {
    res.status(400).send('Missing Arguments');
    return;
  }

  if (username !== undefined) {
    let userCheck = await usersController.findOneByUsername(username);

    if (userCheck !== null) {
      res.status(409).send('Username Taken');
      return;
    }

    params['username'] = username;
  }

  if (file !== undefined) {
    params['avatar'] = file.path.replaceAll(path.sep, path.posix.sep);
  }

  const oldUser = await usersController.findById(userID);

  try {
    const user = await usersController.update(userID, params);

    if (file !== undefined && oldUser !== null) {
      await asyncUnlink(oldUser.avatar);
    }

    res.status(200).send(user);
  } catch (err) {
    if (file !== undefined) {
      await asyncUnlink(file.path);
    }

    throw err;
  }
});

export default router;
