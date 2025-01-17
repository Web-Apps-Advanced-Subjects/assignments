import { Model } from 'mongoose';
import type { ModifyResult, UpdateQuery } from 'mongoose';

class BaseController<T> {
  model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async getAll(): Promise<T[]> {
    return await this.model.find();
  }

  async getById(id: unknown): Promise<T | null> {
    return await this.model.findById(id);
  }

  async create(datum: T): Promise<T | null> {
    return await this.model.create(datum);
  }

  async delete(id: unknown): Promise<T | null> {
    return await this.model.findByIdAndDelete(id);
  }

  async update(id: unknown, datum: T): Promise<ModifyResult<T> | null> {
    return await this.model.findByIdAndUpdate(id, datum as UpdateQuery<T>);
  }
}

export default BaseController;
