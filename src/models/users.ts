import { Schema, Types, model } from 'mongoose';
import type { Model, HydratedDocument, QueryWithHelpers } from 'mongoose';

export type User = {
  username: string;
  password: string;
  avatar: string;
  email: string;
  tokens: string[];
  _id: Types.ObjectId;
};

type UserQueryHelpers = {
  byUsername(
    username: User['username'],
  ): QueryWithHelpers<HydratedDocument<User> | null, HydratedDocument<User>, UserQueryHelpers>;
};

type UserModelType = Model<User, UserQueryHelpers>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
const UserSchema = new Schema<User, UserModelType, {}, UserQueryHelpers>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, required: true },
  email: { type: String, required: true },
  tokens: { type: [String] },
});

UserSchema.query.byUsername = function byUsername(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  this: QueryWithHelpers<any, HydratedDocument<User>, UserQueryHelpers>,
  username: User['username'],
) {
  return this.findOne({ username });
};

export default model<User, UserModelType>('users', UserSchema);
