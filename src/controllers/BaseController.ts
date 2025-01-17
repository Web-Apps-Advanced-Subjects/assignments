import { Types } from 'mongoose';
import type { HydratedDocument, Model } from 'mongoose';

type BaseModel = {
  _id: unknown;
};

class BaseController<T extends BaseModel> {
  model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async getAll(): Promise<HydratedDocument<T>[]> {
    return await this.model.find();
  }

  async findById(id: T['_id']): Promise<HydratedDocument<T> | null> {
    return await this.model.findById(id);
  }

  async create(
    datum: T extends { _id: Types.ObjectId } ? Omit<T, '_id'> : T,
  ): Promise<HydratedDocument<T> | null> {
    return await this.model.create(datum);
  }

  async delete(id: T['_id']): Promise<HydratedDocument<T> | null> {
    return await this.model.findByIdAndDelete(id);
  }

  async update(id: Types.ObjectId, params: Partial<T>) {
    return await this.model.findByIdAndUpdate(id, params);
  }
}

export default BaseController;
