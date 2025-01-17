import jwt from 'jsonwebtoken';
import type { HydratedDocument } from 'mongoose';

import BaseController from './BaseController';

import { userModel, type User } from '../models';

type UserModel = typeof userModel;

class UsersController extends BaseController<User> {
  declare model: UserModel;

  constructor() {
    super(userModel);
  }

  async findOneByUsername(username: User['username']): Promise<HydratedDocument<User> | null> {
    return await this.model.find().byUsername(username);
  }

  generateTokens(_id: User['_id']): { accessToken: string; refreshToken: string } {
    const random = Math.random();

    const accessToken = jwt.sign({ _id, random }, process.env.TOKEN_SECRET as string, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES as string,
    });
    const refreshToken = jwt.sign({ _id, random }, process.env.TOKEN_SECRET as string, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES as string,
    });

    return { accessToken, refreshToken };
  }

  verifyRefreshToken(refreshToken: string): Promise<HydratedDocument<User>> {
    return new Promise<HydratedDocument<User>>((resolve, reject) => {
      jwt.verify(refreshToken, process.env.TOKEN_SECRET as string, async (err, userInfo) => {
        // @ts-expect-error no proper way to type inference to userInfo returned inside the cb
        const userID = userInfo._id;

        try {
          const user = await this.findById(userID);

          if (user === null) {
            reject('fail');
            return;
          }

          if (!user.tokens.includes(refreshToken)) {
            user.tokens = []; // invalidate user tokens
            await user.save();

            reject('fail');
            return;
          }

          const tokens = user.tokens.filter((token) => token !== refreshToken);
          user.tokens = tokens;
          await user.save();

          resolve(user);
        } catch (err) {
          reject('fail');
          return;
        }
      });
    });
  }
}

const usersController = new UsersController();

export default usersController;
