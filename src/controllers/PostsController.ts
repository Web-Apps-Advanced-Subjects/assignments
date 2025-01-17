import postModel from '#root/models/posts.js';
import type { Post } from '#root/models/posts.js';
import BaseController from './BaseController.js';

type PostModel = typeof postModel;

class PostsController extends BaseController<Post> {
  constructor() {
    super(postModel);
  }

  async getAllByOwnerID(ownerID: Post['ownerID']): Promise<PostModel[]> {
    return await this.model.find({ ownerID: ownerID });
  }
}

const postsController = new PostsController();

export default postsController;
