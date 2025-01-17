import BaseController from './BaseController';

import { likeModel, type Like } from '../models';
import type { DeleteMany } from '../types';

type LikeModel = typeof likeModel;

class LikesController extends BaseController<Like> {
  declare model: LikeModel;

  constructor() {
    super(likeModel);
  }

  async deleteByPostID(postID: Like['_id']['postID']): Promise<DeleteMany> {
    return await this.model.find({ '_id.postID': postID }).deleteMany();
  }
}

const likesController = new LikesController();

export default likesController;
