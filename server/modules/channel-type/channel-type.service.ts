import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@server/lib/platform';
import { channelType } from '@server/database/schema';
import { eq, and, count, desc, like } from 'drizzle-orm';

@Injectable()
export class ChannelTypeService {
  private readonly logger = new Logger(ChannelTypeService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE)
    private readonly db: PostgresJsDatabase,
  ) {}

  async findAll(params: {
    keyword?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { keyword, page = 1, pageSize = 20 } = params;

    const conditions = [];
    if (keyword) {
      conditions.push(like(channelType.name, `%${keyword}%`));
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const totalResult = await this.db
      .select({ count: count() })
      .from(channelType)
      .where(whereClause);

    const total = Number(totalResult[0]?.count ?? 0);

    const offset = (page - 1) * pageSize;

    const items = await this.db
      .select({
        id: channelType.id,
        name: channelType.name,
        createdAt: channelType.createdAt,
        updatedAt: channelType.updatedAt,
      })
      .from(channelType)
      .where(whereClause)
      .orderBy(desc(channelType.createdAt))
      .limit(pageSize)
      .offset(offset);

    return { items, total };
  }

  async create(data: { name: string }) {
    try {
      const result = await this.db
        .insert(channelType)
        .values({ name: data.name })
        .returning({ id: channelType.id });

      return { id: result[0].id };
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message.includes('duplicate key')
      ) {
        this.logger.warn(
          `Duplicate channel type name: ${data.name}`,
        );
        throw new ConflictException(
          `渠道类型名称 "${data.name}" 已存在`,
        );
      }
      throw error;
    }
  }

  async update(id: string, data: { name: string }) {
    try {
      const result = await this.db
        .update(channelType)
        .set({ name: data.name })
        .where(eq(channelType.id, id))
        .returning({ id: channelType.id });

      if (result.length === 0) {
        throw new NotFoundException(
          `渠道类型 ${id} 不存在`,
        );
      }

      return { success: true };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (
        error instanceof Error &&
        error.message.includes('duplicate key')
      ) {
        this.logger.warn(
          `Duplicate channel type name: ${data.name}`,
        );
        throw new ConflictException(
          `渠道类型名称 "${data.name}" 已存在`,
        );
      }
      throw error;
    }
  }

  async remove(id: string) {
    const result = await this.db
      .delete(channelType)
      .where(eq(channelType.id, id))
      .returning({ id: channelType.id });

    if (result.length === 0) {
      throw new NotFoundException(
        `渠道类型 ${id} 不存在`,
      );
    }

    return { success: true };
  }
}
