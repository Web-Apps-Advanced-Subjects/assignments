import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeaders = req.headers['authorization'];
  const token = authHeaders && authHeaders.split(' ')[1];

  if (token === undefined) {
    let err: Error & { status?: number } = new Error('Missing Token');
    err.status = 401;
    return next(err);
  }

  jwt.verify(token, process.env.TOKEN_SECRET as string, (err, user) => {
    if (err) {
      return next({ ...err, status: 403 });
    }

    // @ts-expect-error "patching" user to the req object
    req.user = user;
    next();
  });
};

export default authenticate;
