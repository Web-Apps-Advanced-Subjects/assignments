import commentModel from '#root/models/comments.js';
import type { Comment } from '#root/models/comments.js';
import BaseController from './BaseController.js';

type CommentModel = typeof commentModel;

class CommentsController extends BaseController<Comment> {
  constructor() {
    super(commentModel);
  }

  async getAllByPostID(postID: Comment['postId']): Promise<CommentModel[]> {
    return await this.model.find({ ownerID: postID });
  }
}

const commentsController = new CommentsController();

export default commentsController;
