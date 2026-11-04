import {
  DeepPartial,
  FindManyOptions,
  FindOptionsWhere,
  FindOptionsWhereProperty,
  ObjectLiteral,
  Repository,
} from 'typeorm';

export interface DatabaseRepository<T extends ObjectLiteral & { id: string }> {
  findById(id: string): Promise<T | null>;
  findMany(options?: FindManyOptions<T>): Promise<T[]>;
  save(entity: DeepPartial<T>): Promise<T>;
}

export abstract class TypeOrmDatabaseRepository<
  T extends ObjectLiteral & { id: string },
> implements DatabaseRepository<T> {
  constructor(private readonly repository: Repository<T>) {}

  findById(id: string): Promise<T | null> {
    const where = {
      id: id as FindOptionsWhereProperty<T['id']>,
    } as FindOptionsWhere<T>;
    return this.repository.findOneBy(where);
  }

  findMany(options: FindManyOptions<T> = {}): Promise<T[]> {
    return this.repository.find(options);
  }

  save(entity: DeepPartial<T>): Promise<T> {
    return this.repository.save(this.repository.create(entity));
  }
}
