import * as dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import express from 'express';
import type { Express } from 'express';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUI from 'swagger-ui-express';

import { postsRouter, commentsRouter, usersRouter, likesRouter } from './routes';

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/posts', postsRouter);
app.use('/comments', commentsRouter);
app.use('/users', usersRouter);
app.use('/likes', likesRouter);

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Web Dev 2025 REST API',
      version: '1.0.0',
      description: 'REST server including authentication using JWT',
    },
    servers: [{ url: 'http://localhost:3000' }],
  },
  apis: ['./src/routes/*.ts'],
};
const specs = swaggerJsDoc(options);
app.use('/docs', swaggerUI.serve, swaggerUI.setup(specs));

const db = mongoose.connection;
db.on('error', (error) => console.log(error));
db.on('connection', () => console.log('connected to database'));

const initApp = async (): Promise<Express> => {
  const db_url = process.env.DB_URL as string;

  await mongoose.connect(db_url, { serverSelectionTimeoutMS: 5000 });

  return app;
};

export default initApp;
