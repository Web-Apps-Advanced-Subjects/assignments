import type { HydratedDocument } from 'mongoose';

import BaseController from './BaseController';

import { commentModel, type Comment } from '../models';
import type { DeleteMany } from '../types';

type CommentModel = typeof commentModel;

class CommentsController extends BaseController<Comment> {
  declare model: CommentModel;
  constructor() {
    super(commentModel);
  }

  async getAllByPostID(postID: Comment['postID']): Promise<HydratedDocument<Comment>[]> {
    return await this.model.find().byPostID(postID);
  }

  async getAllByUserID(userID: Comment['userID']): Promise<HydratedDocument<Comment>[]> {
    return await this.model.find().byUserID(userID);
  }

  async getAllByUserIDAndPostID(
    userID: Comment['userID'],
    postID: Comment['postID'],
  ): Promise<HydratedDocument<Comment>[]> {
    return await this.model.find().byUserID(userID).byPostID(postID);
  }

  async getNumberOfComments(): Promise<number> {
    return await this.model.countDocuments();
  }

  async getCountByPostID(postID: Comment['postID']): Promise<number> {
    return await this.model.find().byPostID(postID).countDocuments();
  }

  async getCountByUserID(userID: Comment['userID']): Promise<number> {
    return await this.model.find().byUserID(userID).countDocuments();
  }

  async getCountByUserIDAndPostID(
    userID: Comment['userID'],
    postID: Comment['postID'],
  ): Promise<number> {
    return await this.model.find().byUserID(userID).byPostID(postID).countDocuments();
  }

  async deleteByPostID(postID: Comment['postID']): Promise<DeleteMany> {
    return await this.model.find().byPostID(postID).deleteMany();
  }
}

const commentsController = new CommentsController();

export default commentsController;
