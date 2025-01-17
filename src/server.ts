import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import express from 'express';
import type { Express } from 'express';

dotenv.config();
import postsRouter from '#root/routes/posts.js';
import commentsRouter from '#root/routes/comments.js';

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/posts', postsRouter);
app.use('/comments', commentsRouter);

const db = mongoose.connection;
db.on('error', (error) => console.log(error));
db.on('connection', () => console.log('connected to database'));

const initApp = async (): Promise<Express> => {
  const db_url = process.env.DB_URL;
  if (db_url === undefined) {
    throw Error('DB_URL not defined in environment');
  }

  await mongoose.connect(db_url);

  return app;
};

export default initApp;
