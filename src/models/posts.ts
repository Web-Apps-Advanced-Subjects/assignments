import mongoose from 'mongoose';

export interface Post {
  title: string;
  content: string;
  ownerID: string;
}

const postSchema = new mongoose.Schema<Post>({
  title: {
    type: String,
    required: true,
  },
  content: String,
  ownerID: {
    type: String,
    required: true,
  },
});

const postModel = mongoose.model<Post>('Posts', postSchema);

export default postModel;
