import express from 'express';
import commentsController from '#root/controllers/CommentsController.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const postID = req.query.postID;

  try {
    if (postID !== undefined && typeof postID === 'string') {
      const posts = await commentsController.getAllByPostID(postID);
      res.status(200).send(posts);
    } else {
      const posts = await commentsController.getAll();
      res.status(200).send(posts);
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const post = await commentsController.getById(id);

    if (post != null) {
      res.status(200).send(post);
    } else {
      res.status(404).send('not found');
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post('/', async (req, res) => {
  const postParams = req.body;

  try {
    const post = await commentsController.create(postParams);
    res.status(201).send(post);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const postParams = req.body;

  try {
    const post = await commentsController.update(id, postParams);
    res.status(201).send(post);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const post = await commentsController.delete(id);

    if (post != null) {
      res.status(200).send(post);
    } else {
      res.status(404).send('not found');
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

export default router;
