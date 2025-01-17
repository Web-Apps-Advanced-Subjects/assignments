import express from 'express';
import { Types, type HydratedDocument } from 'mongoose';

import { commentsController } from '../controllers';
import { authenticate } from '../middleware';
import { type Comment } from '../models';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: The Comments API
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
 *     PartialComment:
 *       type: object
 *       properties:
 *         content:
 *           type: string
 *           description: The comment text content
 *       example:
 *         content: 'This post is awesome'
 *     Comment:
 *       allOf:
 *       - $ref: '#/components/schemas/PartialComment'
 *       - type: object
 *         required:
 *           - postID
 *         properties:
 *           postID:
 *             type: string
 *             description: The comment post id
 *         example:
 *           postID: '6777cbe51ead7054a6a78d74'
 *       required:
 *         - content
 *     DBComment:
 *       allOf:
 *       - $ref: '#/components/schemas/Comment'
 *       - type: object
 *         required:
 *           - userID
 *           - _id
 *         properties:
 *           userID:
 *             type: string
 *             description: The comment user id
 *           _id:
 *             type: string
 *             description: The comment id
 *         example:
 *           userID: '6777cbe51ead7054a6a78d74'
 *           _id: '6777cbe51ead7054a6a78d74'
 */

/**
 * @swagger
 * /comments:
 *   get:
 *     summary: Get comments
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userID
 *         type: string
 *         description: The userID to filter by if needed
 *       - in: query
 *         name: postID
 *         type: string
 *         description: The postID to filter by if needed
 *     responses:
 *       200:
 *         description: the wanted comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DBComment'
 *       401:
 *         description: Not authenticated
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

router.get('/', authenticate, async (req, res) => {
  const postID = req.query.postID as unknown as Types.ObjectId | undefined;
  const userID = req.query.userID as unknown as Types.ObjectId | undefined;
  let comments: HydratedDocument<Comment>[];

  if (postID !== undefined) {
    comments = await commentsController.getAllByPostID(postID);
  } else if (userID !== undefined) {
    comments = await commentsController.getAllByUserID(userID);
  } else {
    comments = await commentsController.getAll();
  }

  res.status(200).json({ comments });
});

/**
 * @swagger
 * /comments/count:
 *   get:
 *     summary: Get comments count
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userID
 *         type: string
 *         description: The userID to count comments by
 *       - in: query
 *         name: postID
 *         type: string
 *         description: The postID to count comments by
 *     responses:
 *       200:
 *         description: the comments count
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 required:
 *                   - count
 *                 properties:
 *                   count:
 *                     type: number
 *                     description: the comment count
 *                 example:
 *                   count: 47
 *                   
 *       401:
 *         description: Not authenticated
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

router.get('/count', authenticate, async (req, res) => {
  const postID = req.query.postID as unknown as Types.ObjectId | undefined;
  const userID = req.query.userID as unknown as Types.ObjectId | undefined;
  let count: number;

  if (postID === undefined && userID === undefined) {
    count = await commentsController.getNumberOfComments();
  } else if (postID !== undefined && userID === undefined) {
    count = await commentsController.getCountByPostID(postID);
  } else if (postID === undefined && userID !== undefined) {
    count = await commentsController.getCountByUserID(userID);
  } else {
    // @ts-expect-error ts cannot narrow down that userID and postID HAVE to be undefined at this point
    count = await commentsController.getCountByUserIDAndPostID(userID, postID);
  }

  res.status(200).json({ count });
});

/**
 * @swagger
 * /comments/{id}:
 *   get:
 *     summary: Get posts
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: string
 *         description: The id of the comment to fetch
 *     responses:
 *       200:
 *         description: the matching comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DBComment'
 *       401:
 *         description: Not authenticated
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       404:
 *         description: No matching comment found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

router.get('/:id', authenticate, async (req, res) => {
  const id = req.params.id as unknown as Types.ObjectId;
  const post = await commentsController.findById(id);

  if (post !== null) {
    res.status(200).send(post);
  } else {
    res.status(404).send('not found');
  }
});

/**
 * @swagger
 * /comment:
 *   post:
 *     summary: Create new comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       201:
 *         description: The new post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DBComment'
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
 */

router.post('/', authenticate, async (req, res) => {
  const { content, postID } = req.body;

  if (content === undefined || postID === undefined) {
    res.status(400).send('Missing Arguments');
    return;
  }

  // @ts-expect-error "user" was patched to the req object from the auth middleware
  const comment = await commentsController.create({ content, postID, userID: req.user._id });

  res.status(201).send(comment);
});

/**
* @swagger
* /comments/{id}:
*   put:
*     summary: Update comment
*     tags: [Comments]
*     security:
*       - bearerAuth: []
*     parameters:
*       - in: path
*         name: id
*         required: true
*         type: string
*         description: The id of the comment to update
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/PartialComment'
*     responses:
*       200:
*         description: The old updated comment
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/DBComment'
*       401:
*         description: Not authenticated
*         content:
*           text/plain:
*             schema:
*               type: string
*/

router.put('/:id', authenticate, async (req, res) => {
  const id = req.params.id as unknown as Types.ObjectId;
  const { content } = req.body;

  const commentParams: Partial<Comment> = {};

  if (content !== undefined) {
    commentParams['content'] = content;
  }

  const comment = await commentsController.update(id, commentParams);

  res.status(200).send(comment);
});

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Delete comment by id
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: string
 *         description: The id of the comment to delete
 *     responses:
 *       200:
 *         description: The deleted comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DBComment'
 *       401:
 *         description: Not authenticated
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       404:
 *         description: No matching comment was found to delete
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

router.delete('/:id', authenticate, async (req, res) => {
  const id = req.params.id as unknown as Types.ObjectId;

  const post = await commentsController.delete(id);

  if (post !== null) {
    res.status(200).send(post);
  } else {
    res.status(404).send('not found');
  }
});

export default router;
