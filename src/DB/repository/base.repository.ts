import {
  Model,
  HydratedDocument,
  QueryOptions,
  ProjectionType,
  AnyKeys,
  UpdateQuery,
} from 'mongoose';
import { Ipagination } from '../../common/interface/pagination.interface.js';

/**
 * Generic Database Repository providing common CRUD operations.
 * Optimized for Mongoose 9.x standards and type safety.
 */
export class DataBaseRepository<TRowDoc> {
  constructor(protected readonly model: Model<TRowDoc>) { }

  // ==================== CREATE ====================

  /**
   * Creates one or multiple documents.
   */
  async create({
    data,
  }: {
    data: Partial<TRowDoc> | undefined;
  }): Promise<HydratedDocument<TRowDoc> | HydratedDocument<TRowDoc>[]> {
    return await this.model.insertMany(data as any,) as HydratedDocument<TRowDoc>[]
  }

  async insertMany({
    data,
    options,
  }: {
    data: AnyKeys<TRowDoc>[] | Partial<TRowDoc>[];
    options?: QueryOptions;
  }): Promise<HydratedDocument<TRowDoc> | HydratedDocument<TRowDoc>[]> {
    return await this.model.create(data as any, options);
  }

  /**
   * Creates a single document.
   */
  async createOne({
    data,
    options,
  }: {
    data: Partial<TRowDoc>;
    options?: QueryOptions;
  }): Promise<HydratedDocument<TRowDoc>> {
    const doc = await this.model.create(data as any, options);
    return doc as HydratedDocument<TRowDoc>;
  }

  // ==================== FIND ====================

  /**
   * Finds multiple documents based on the filter.
   */
  async find({
    filter,
    projection,
    options,
  }: {
    filter: Record<string, any>;
    projection?: ProjectionType<TRowDoc>;
    options?: QueryOptions & { lean?: boolean };
  }): Promise<any[]> {
    const query = this.model.find(filter, projection, options);
    if (options?.lean) return await query.lean();
    if (options?.skip) return await query.lean();
    if (options?.limit) return await query.lean();
    return await query;
  }

  async paginate({
    filter,
    projection,
    options = {},
    page = 0,
    size = 5
  }: {
    filter: Record<string, any>;
    projection?: ProjectionType<TRowDoc>;
    options?: QueryOptions & { lean?: boolean };
    page?: number | string | undefined;
    size?: number | string | undefined;
  }): Promise<Ipagination<TRowDoc>> {
    let count: number = -1

    if (Number(page) > 0) {
      page = parseInt(page as string)
      size = parseInt(size as string)
      options.skip = (page - 1) * size
      options.limit = size
      count = await this.countDocuments({ filter })
    }
    const docs = await this.find({
      filter: filter || {},
      ...(projection !== undefined && { projection }),
      ...(options !== undefined && { options })
    })

    return {
      docs,
      ...(Number(page) > 0 ? { currentPage: page, size: size, pages: Math.ceil(count / parseInt(size as string)) } : {}),
    }
  }

  /**
   * Finds a single document based on the filter.
   */
  async findOne({
    filter,
    projection,
    options,
  }: {
    filter: Record<string, any>;
    projection?: ProjectionType<TRowDoc>;
    options?: QueryOptions & { lean?: boolean };
  }): Promise<any | null> {
    const query = this.model.findOne(filter, projection, options);
    if (options?.lean) return await query.lean();
    return await query;
  }

  /**
   * Finds a document by its ID.
   */
  async findById({
    id,
    projection,
    options,
  }: {
    id: string;
    projection?: ProjectionType<TRowDoc>;
    options?: QueryOptions & { lean?: boolean };
  }): Promise<any | null> {
    const query = this.model.findById(id, projection, options);
    if (options?.lean) return await query.lean();
    return await query;
  }

  // ==================== UPDATE ====================

  /**
   * Updates a single document matching the filter and returns it.
   */
  async findOneAndUpdate({
    filter,
    update,
    options,
  }: {
    filter: Record<string, any>;
    update: UpdateQuery<TRowDoc>;
    options?: QueryOptions;
  }): Promise<HydratedDocument<TRowDoc> | null> {
    if (Array.isArray(update)) {
      update.push({ $set: { __v: { $add: ["$__v", 1] } } })
      return await this.model.findOneAndUpdate(filter, update, { ...options, updatePipeline: true, new: true })
    }
    return await this.model.findOneAndUpdate(filter, update, { ...options, $incr: { __v: 1 }, new: true })
  }

  /**
   * Updates a single document matching the filter.
   */
  async updateOne({
    filter,
    update,
    options,
  }: {
    filter: Record<string, any>;
    update: any;
    options?: QueryOptions;
  }): Promise<HydratedDocument<TRowDoc> | null> {
    return await this.findOneAndUpdate({
      filter,
      update,
      ...(options !== undefined && { options })
    });
  }

  /**
   * Updates a document by its ID.
   */
  async updateById({
    id,
    update,
    options,
  }: {
    id: string;
    update: any;
    options?: QueryOptions;
  }): Promise<HydratedDocument<TRowDoc> | null> {
    return await this.model.findByIdAndUpdate(id, update, {
      new: true,
      ...(options as any),
    }) as any;
  }

  /**
   * Updates multiple documents matching the filter.
   */
  async updateMany({
    filter,
    update,
    options,
  }: {
    filter: Record<string, any>;
    update: any;
    options?: QueryOptions;
  }): Promise<{ matchedCount: number; modifiedCount: number }> {
    const result = await this.model.updateMany(filter, update, options as any);
    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  }

  // ==================== DELETE ====================

  /**
   * Deletes a single document matching the filter.
   */
  async deleteOne({
    filter,
    options,
  }: {
    filter: Record<string, any>;
    options?: QueryOptions;
  }): Promise<HydratedDocument<TRowDoc> | null> {
    return await this.model.findOneAndDelete(filter, options as any) as any;
  }

  /**
   * Deletes a document by its ID.
   */
  async deleteById({
    id,
    options,
  }: {
    id: string;
    options?: QueryOptions;
  }): Promise<HydratedDocument<TRowDoc> | null> {
    return await this.model.findByIdAndDelete(id, options);
  }

  /**
   * Deletes multiple documents matching the filter.
   */
  async deleteMany({
    filter,
    options,
  }: {
    filter: Record<string, any>;
    options?: any;
  }): Promise<{ deletedCount: number }> {
    const result = await this.model.deleteMany(filter, options);
    return {
      deletedCount: result.deletedCount ?? 0,
    };
  }

  // ==================== UTILS ====================

  /**
   * Checks if a document exists matching the filter.
   */
  async exists({
    filter,
  }: {
    filter: Record<string, any>;
  }): Promise<boolean> {
    const result = await this.model.exists(filter);
    return result !== null;
  }

  /**
   * Counts documents matching the filter.
   */
  async countDocuments({
    filter,
    options,
  }: {
    filter?: Record<string, any>;
    options?: QueryOptions;
  }): Promise<number> {
    return await this.model.countDocuments(filter ?? {}, options as any);
  }
}