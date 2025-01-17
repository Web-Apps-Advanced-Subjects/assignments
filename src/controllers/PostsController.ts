import type { Document, HydratedDocument, Types } from 'mongoose';

import BaseController from './BaseController';
import commentsController from './CommentsController';
import likesController from './LikesController';

import { postModel, type Post } from '../models';

type PostModel = typeof postModel;

type Filters = {
  limit?: number;
  lastID?: Types.ObjectId;
};

class PostsController extends BaseController<Post> {
  declare model: PostModel;

  constructor() {
    super(postModel);
  }

  async getAll(filters: Filters = {}): Promise<HydratedDocument<Post>[]> {
    let query;

    if (filters.lastID !== undefined) {
      query = this.model.find({ _id: { $gt: filters.lastID } });
    } else {
      query = this.model.find();
    }

    if (filters.limit !== undefined) {
      query = query.limit(filters.limit);
    }

    return await query;
  }

  async getAllByUserID(
    userID: Post['userID'],
    filters: Filters = {},
  ): Promise<HydratedDocument<Post>[]> {
    let query;

    if (filters.lastID !== undefined) {
      query = this.model.find({ _id: { $gt: filters.lastID } });
    } else {
      query = this.model.find();
    }

    query = query.byUserID(userID);

    if (filters.limit !== undefined) {
      query = query.limit(filters.limit);
    }

    return await query;
  }

  async delete(id: Post['_id']): Promise<HydratedDocument<Post> | null> {
    await commentsController.deleteByPostID(id);
    await likesController.deleteByPostID(id);
    return super.delete(id);
  }
}

const postsController = new PostsController();

export default postsController;
