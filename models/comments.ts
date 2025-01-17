import mongoose from 'mongoose';

export interface Comment {
  comment: string;
  ownerID: string;
  postID: string;
}

const commentSchema = new mongoose.Schema<Comment>({
  comment: {
    type: String,
    required: true,
  },
  ownerID: {
    type: String,
    required: true,
  },
  postID: {
    type: String,
    required: true,
  },
});

const commentModel = mongoose.model<Comment>('Comments', commentSchema);

export default commentModel;
