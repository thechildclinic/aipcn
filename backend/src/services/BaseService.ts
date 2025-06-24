import { Model, ModelStatic, FindOptions, CreateOptions, UpdateOptions, DestroyOptions } from 'sequelize';
import { ValidationError } from '../utils/validation';

// Re-export ValidationError for convenience
export { ValidationError } from '../utils/validation';

// Custom error classes
export class NotFoundError extends Error {
  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` with id ${id}` : ''} not found`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string, originalError?: Error) {
    super(message);
    this.name = 'DatabaseError';
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

// Base service interface
export interface IBaseService<T extends Model, TCreationAttributes, TUpdateAttributes> {
  findAll(options?: FindOptions): Promise<T[]>;
  findById(id: string, options?: FindOptions): Promise<T>;
  findByIdOptional(id: string, options?: FindOptions): Promise<T | null>;
  create(data: TCreationAttributes, options?: CreateOptions): Promise<T>;
  update(id: string, data: TUpdateAttributes, options?: UpdateOptions): Promise<T>;
  delete(id: string, options?: DestroyOptions): Promise<void>;
  count(options?: FindOptions): Promise<number>;
  exists(id: string): Promise<boolean>;
}

// Base service implementation
export abstract class BaseService<T extends Model, TCreationAttributes, TUpdateAttributes> 
  implements IBaseService<T, TCreationAttributes, TUpdateAttributes> {
  
  protected model: ModelStatic<T>;
  protected resourceName: string;

  constructor(model: ModelStatic<T>, resourceName: string) {
    this.model = model;
    this.resourceName = resourceName;
  }

  /**
   * Find all records with optional filtering and pagination
   */
  async findAll(options: FindOptions = {}): Promise<T[]> {
    try {
      return await this.model.findAll(options);
    } catch (error) {
      throw new DatabaseError(`Failed to fetch ${this.resourceName} records`, error as Error);
    }
  }

  /**
   * Find a record by ID, throw error if not found
   */
  async findById(id: string, options: FindOptions = {}): Promise<T> {
    try {
      const record = await this.model.findByPk(id, options);
      if (!record) {
        throw new NotFoundError(this.resourceName, id);
      }
      return record;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to fetch ${this.resourceName} by id`, error as Error);
    }
  }

  /**
   * Find a record by ID, return null if not found
   */
  async findByIdOptional(id: string, options: FindOptions = {}): Promise<T | null> {
    try {
      return await this.model.findByPk(id, options);
    } catch (error) {
      throw new DatabaseError(`Failed to fetch ${this.resourceName} by id`, error as Error);
    }
  }

  /**
   * Create a new record
   */
  async create(data: TCreationAttributes, options: CreateOptions = {}): Promise<T> {
    try {
      return await this.model.create(data as any, options);
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ConflictError(`${this.resourceName} with this data already exists`);
      }
      if (error.name === 'SequelizeValidationError') {
        const details = error.errors.map((err: any) => ({
          field: err.path,
          message: err.message,
        }));
        throw new ValidationError('Validation failed', details);
      }
      throw new DatabaseError(`Failed to create ${this.resourceName}`, error);
    }
  }

  /**
   * Update a record by ID
   */
  async update(id: string, data: TUpdateAttributes, options: Omit<UpdateOptions, 'where'> = {}): Promise<T> {
    try {
      const record = await this.findById(id);
      await record.update(data as any, options);
      return record;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      if ((error as any).name === 'SequelizeUniqueConstraintError') {
        throw new ConflictError(`${this.resourceName} with this data already exists`);
      }
      if ((error as any).name === 'SequelizeValidationError') {
        const details = (error as any).errors.map((err: any) => ({
          field: err.path,
          message: err.message,
        }));
        throw new ValidationError('Validation failed', details);
      }
      throw new DatabaseError(`Failed to update ${this.resourceName}`, error as Error);
    }
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string, options: DestroyOptions = {}): Promise<void> {
    try {
      const record = await this.findById(id);
      await record.destroy(options);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to delete ${this.resourceName}`, error as Error);
    }
  }

  /**
   * Count records with optional filtering
   */
  async count(options: FindOptions = {}): Promise<number> {
    try {
      return await this.model.count(options);
    } catch (error) {
      throw new DatabaseError(`Failed to count ${this.resourceName} records`, error as Error);
    }
  }

  /**
   * Check if a record exists by ID
   */
  async exists(id: string): Promise<boolean> {
    try {
      const count = await this.model.count({ where: { id } as any });
      return count > 0;
    } catch (error) {
      throw new DatabaseError(`Failed to check ${this.resourceName} existence`, error as Error);
    }
  }

  /**
   * Find records with pagination
   */
  async findWithPagination(
    page: number = 1, 
    limit: number = 10, 
    options: FindOptions = {}
  ): Promise<{ records: T[]; total: number; page: number; limit: number; totalPages: number }> {
    try {
      const offset = (page - 1) * limit;
      const { count, rows } = await this.model.findAndCountAll({
        ...options,
        limit,
        offset,
      });

      return {
        records: rows,
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      };
    } catch (error) {
      throw new DatabaseError(`Failed to fetch paginated ${this.resourceName} records`, error as Error);
    }
  }

  /**
   * Find one record by criteria
   */
  async findOne(options: FindOptions): Promise<T | null> {
    try {
      return await this.model.findOne(options);
    } catch (error) {
      throw new DatabaseError(`Failed to find ${this.resourceName}`, error as Error);
    }
  }

  /**
   * Find one record by criteria, throw error if not found
   */
  async findOneRequired(options: FindOptions): Promise<T> {
    try {
      const record = await this.model.findOne(options);
      if (!record) {
        throw new NotFoundError(this.resourceName);
      }
      return record;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find ${this.resourceName}`, error as Error);
    }
  }

  /**
   * Bulk create records
   */
  async bulkCreate(data: TCreationAttributes[], options: CreateOptions = {}): Promise<T[]> {
    try {
      return await this.model.bulkCreate(data as any[], options);
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ConflictError(`Some ${this.resourceName} records already exist`);
      }
      throw new DatabaseError(`Failed to bulk create ${this.resourceName} records`, error);
    }
  }

  /**
   * Bulk update records
   */
  async bulkUpdate(data: TUpdateAttributes, options: UpdateOptions): Promise<number> {
    try {
      const [affectedCount] = await this.model.update(data as any, options);
      return affectedCount;
    } catch (error) {
      throw new DatabaseError(`Failed to bulk update ${this.resourceName} records`, error as Error);
    }
  }

  /**
   * Bulk delete records
   */
  async bulkDelete(options: DestroyOptions): Promise<number> {
    try {
      return await this.model.destroy(options);
    } catch (error) {
      throw new DatabaseError(`Failed to bulk delete ${this.resourceName} records`, error as Error);
    }
  }
}
