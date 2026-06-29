import { Repository, FindManyOptions, ObjectLiteral } from 'typeorm';

export interface PaginationParams {
  page: number;
  perPage: number;
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function getPaginationParams(page?: number, perPage?: number): PaginationParams {
  const p = page && page > 0 ? page : 1;
  const pp = perPage && perPage > 0 && perPage <= 100 ? perPage : 20;
  return { page: p, perPage: pp };
}

export async function paginate<T extends ObjectLiteral>(
  repository: Repository<T>,
  options: FindManyOptions<T>,
  params: PaginationParams,
): Promise<PaginatedResult<T>> {
  const { page, perPage } = params;
  const skip = (page - 1) * perPage;

  const [data, total] = await repository.findAndCount({
    ...options,
    skip,
    take: perPage,
  });

  return {
    data,
    meta: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  };
}
