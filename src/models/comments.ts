import { Schema, Types, model } from 'mongoose';
import type { Model, HydratedDocument, QueryWithHelpers } from 'mongoose';

export type Comment = {
  content: string;
  userID: Types.ObjectId;
  postID: Types.ObjectId;
  _id: Types.ObjectId;
};

type CommentQueryHelpers = {
  byPostID(
    postID: Comment['postID'],
  ): QueryWithHelpers<HydratedDocument<Comment>[], HydratedDocument<Comment>, CommentQueryHelpers>;
  byUserID(
    userID: Comment['userID'],
  ): QueryWithHelpers<HydratedDocument<Comment>[], HydratedDocument<Comment>, CommentQueryHelpers>;
};

type CommentModel = Model<Comment, CommentQueryHelpers>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
const commentSchema = new Schema<Comment, CommentModel, {}, CommentQueryHelpers>({
  content: { type: String, required: true },
  userID: { type: Schema.ObjectId, ref: 'users' },
  postID: { type: Schema.ObjectId, ref: 'posts' },
});

commentSchema.query.byPostID = function byPostID(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  this: QueryWithHelpers<any, HydratedDocument<Comment>, CommentQueryHelpers>,
  postID: Comment['postID'],
) {
  return this.find({ postID });
};

commentSchema.query.byUserID = function byUserID(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  this: QueryWithHelpers<any, HydratedDocument<Comment>, CommentQueryHelpers>,
  userID: Comment['userID'],
) {
  return this.find({ userID });
};

export default model<Comment, CommentModel>('comments', commentSchema);
