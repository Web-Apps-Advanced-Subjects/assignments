import express from 'express';
import postsController from '#root/controllers/PostsController.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const ownerID = req.query.ownerID;

  try {
    if (ownerID !== undefined && typeof ownerID === 'string') {
      const posts = await postsController.getAllByOwnerID(ownerID);
      res.status(200).send(posts);
    } else {
      const posts = await postsController.getAll();
      res.status(200).send(posts);
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const post = await postsController.getById(id);

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
    const post = await postsController.create(postParams);
    res.status(201).send(post);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const postParams = req.body;

  try {
    const post = await postsController.update(id, postParams);
    res.status(201).send(post);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const post = await postsController.delete(id);

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
