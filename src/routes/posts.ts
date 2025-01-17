import express from 'express';
import { Types } from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

import { postsController } from '../controllers';
import { authenticate } from '../middleware';
import { type Post } from '../models';

const asyncUnlink = promisify(fs.unlink);
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/media/');
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
 *   name: Posts
 *   description: The Posts API
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
 *     PartialPost:
 *       type: object
 *       properties:
 *         content:
 *           type: string
 *           description: The post text content
 *         media:
 *           type: string
 *           format: binary
 *           description: The post media content
 *         title:
 *             type: string
 *             description: The post title
 *       example:
 *         title: 'Awesome post'
 *         content: 'This post is awesome'
 *         media: 'awesome.png'
 *     Post:
 *       allOf:
 *       - $ref: '#/components/schemas/PartialPost'
 *       required:
 *         - title
 *     DBPost:
 *       allOf:
 *       - $ref: '#/components/schemas/Post'
 *       - type: object
 *         required:
 *           - userID
 *           - _id
 *         properties:
 *           userID:
 *             type: string
 *             description: The post user id
 *           _id:
 *             type: string
 *             description: The post id
 *         example:
 *           userID: '6777cbe51ead7054a6a78d74'
 *           _id: '6777cbe51ead7054a6a78d74'
 */

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get posts
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userID
 *         type: string
 *         description: The userID to filter by if needed
 *       - in: query
 *         name: limit
 *         type: number
 *         description: Limit the amount of results returned back from the server
 *       - in: query
 *         name: lastID
 *         type: string
 *         description: An offset like post id to start the query from (not included)
 *     responses:
 *       200:
 *         description: the wanted posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DBPost'
 *       401:
 *         description: Not authenticated
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

router.get('/', authenticate, async (req, res) => {
  const userID = req.query.userID as unknown as Types.ObjectId | undefined;
  const limit = req.query.limit as unknown as number | undefined;
  const lastID = req.query.lastID as unknown as Types.ObjectId | undefined;

  if (userID !== undefined) {
    const posts = await postsController.getAllByUserID(userID, { limit, lastID });

    res.status(200).json({ posts });
  } else {
    const posts = await postsController.getAll({ limit, lastID });

    res.status(200).json({ posts });
  }
});

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Get posts
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: string
 *         description: The id of the post to fetch
 *     responses:
 *       200:
 *         description: the matching post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DBPost'
 *       401:
 *         description: Not authenticated
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       404:
 *         description: No matching post found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

router.get('/:id', authenticate, async (req, res) => {
  const id = req.params.id as unknown as Types.ObjectId;
  const post = await postsController.findById(id);

  if (post !== null) {
    res.status(200).send(post);
  } else {
    res.status(404).send('Not Found');
  }
});

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Update post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/Post'
 *     responses:
 *       201:
 *         description: The new post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DBPost'
 *       400:
 *         description: Missing arguments/Bad media file format
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
 */

router.post('/', authenticate, upload.single('media'), async (req, res) => {
  const { title, content } = req.body;
  // @ts-expect-error "user" was patched to the req object from the auth middleware
  const userID = req.user._id;
  const file = req.file;

  if (title === undefined) {
    if (file !== undefined) {
      await asyncUnlink(file.path);
    }

    res.status(400).send('Missing Arguments');
    return;
  }

  let media: string | undefined = undefined;

  if (file !== undefined) {
    if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpeg') {
      await asyncUnlink(file.path);

      res.status(400).send('File Type Unsupported');
      return;
    }

    media = file.path.replaceAll(path.sep, path.posix.sep);
  }

  try {
    const post = await postsController.create({ title, content, media, userID });

    res.status(201).send(post);
  } catch (err) {
    if (file !== undefined) {
      await asyncUnlink(file.path);
    }

    throw err;
  }
});

/**
 * @swagger
 * /posts/{id}:
 *   put:
 *     summary: Create new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: string
 *         description: The id of the post to update
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/PartialPost'
 *     responses:
 *       200:
 *         description: The old updated post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DBPost'
 *       400:
 *         description: Bad media file format
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
 */

router.put('/:id', authenticate, upload.single('media'), async (req, res) => {
  const id = req.params.id as unknown as Types.ObjectId;
  const { title, content } = req.body;
  const file = req.file;

  const postParams: Partial<Post> = {};

  if (title !== undefined) {
    postParams['title'] = title;
  }
  if (content !== undefined) {
    postParams['content'] = content;
  }
  if (file !== undefined) {
    if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpeg') {
      await asyncUnlink(file.path);

      res.status(400).send('File Type Unsupported');
      return;
    }

    postParams['media'] = file.path.replaceAll(path.sep, path.posix.sep);
  }

  const oldPost = await postsController.findById(id);

  try {
    const post = await postsController.update(id, postParams);

    if (file !== undefined && oldPost?.media !== undefined) {
      await asyncUnlink(oldPost.media);
    }

    res.status(200).send(post);
  } catch (err) {
    if (file !== undefined) {
      await asyncUnlink(file.path);
    }

    throw err;
  }
});

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Delete post by id and all associated comments and likes
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: string
 *         description: The id of the post to delete
 *     responses:
 *       200:
 *         description: The deleted post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DBPost'
 *       401:
 *         description: Not authenticated
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       404:
 *         description: No matching post was found to delete
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

router.delete('/:id', authenticate, async (req, res) => {
  const id = req.params.id as unknown as Types.ObjectId;

  const post = await postsController.findById(id);

  if (post !== null) {
    await postsController.delete(id);

    if (post.media !== undefined) {
      await asyncUnlink(post.media);
    }

    res.status(200).send(post);
  } else {
    res.status(404).send('Not Found');
  }
});

export default router;
