import { Schema, Types, model } from 'mongoose';

type CompositeLikeID = {
  userID: Types.ObjectId;
  postID: Types.ObjectId;
};

const CompositeLikeIDSchema = new Schema<CompositeLikeID>(
  {
    userID: { type: Schema.ObjectId, ref: 'users' },
    postID: { type: Schema.ObjectId, ref: 'posts' },
  },
  { _id: false },
);

export type Like = {
  _id: CompositeLikeID;
};

const LikeSchema = new Schema<Like>({
  _id: CompositeLikeIDSchema,
});

export default model<Like>('likes', LikeSchema);
