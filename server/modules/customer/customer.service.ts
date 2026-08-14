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
import {
  customer,
  customerCategoryGrade,
  userAccount,
  productCategory,
} from '@server/database/schema';
import { PRODUCT_CATEGORIES } from '@shared/customer';
import {
  eq, and, count, desc, like, or, sql,
} from 'drizzle-orm';

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE)
    private readonly db: PostgresJsDatabase,
  ) {}

  async findAll(params: {
    keyword?: string;
    page?: number;
    pageSize?: number;
  }, userId?: string, roles?: string[]) {
    const { keyword, page = 1, pageSize = 20 } = params;

    const conditions = [];
    if (keyword) {
      conditions.push(
        or(
          like(customer.shortName, `%${keyword}%`),
          like(customer.fullName, `%${keyword}%`),
        ),
      );
    }

    const isSuperAdmin = roles?.includes('super_admin');
    if (!isSuperAdmin && userId) {
      const accountRows = await this.db
        .select({ region: userAccount.region })
        .from(userAccount)
        .where(sql`(${userAccount.userId}).user_id = ${userId}`)
        .limit(1);
      const userRegion = accountRows[0]?.region || '';
      if (userRegion) {
        conditions.push(eq(customer.region, userRegion));
      }
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const totalResult = await this.db
      .select({ count: count() })
      .from(customer)
      .where(whereClause);

    const total = Number(totalResult[0]?.count ?? 0);

    const offset = (page - 1) * pageSize;

    const items = await this.db
      .select({
        id: customer.id,
        shortName: customer.shortName,
        fullName: customer.fullName,
        country: customer.country,
        region: customer.region,
        channelType: customer.channelType,
        creditCondition: customer.creditCondition,
        grade: customer.grade,
        customerCode: customer.customerCode,
        paymentTerm: customer.paymentTerm,
        continent: customer.continent,
        salesChannel: customer.salesChannel,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      })
      .from(customer)
      .where(whereClause)
      .orderBy(desc(customer.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      items,
      total,
    };
  }

  async search(q: string) {
    const items = await this.db
      .select({
        id: customer.id,
        shortName: customer.shortName,
      })
      .from(customer)
      .where(like(customer.shortName, `%${q}%`))
      .orderBy(customer.shortName)
      .limit(20);

    return items;
  }

  async generateCustomerCode(): Promise<string> {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const prefix = `C${dateStr}`;
    const result = await this.db
      .select({ count: count() })
      .from(customer)
      .where(like(customer.customerCode, `${prefix}%`));
    const seq = (Number(result[0]?.count ?? 0)) + 1;
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  async create(
    data: {
      shortName: string;
      fullName: string;
      country: string;
      region: string;
      channelType: string;
      creditCondition: string;
      grade: string;
      customerCode?: string;
      paymentTerm?: string;
      continent?: string;
      salesChannel?: string;
    },
    userId?: string,
    roles?: string[],
    userRegion?: string,
  ) {
    // 非超管用户创建客户时，region 强制为当前用户所属区域
    const isSuperAdmin = roles?.includes('super_admin');
    if (!isSuperAdmin && userRegion) {
      data.region = userRegion;
    }
    try {
      const customerCode = data.customerCode
        || await this.generateCustomerCode();

      const result = await this.db
        .insert(customer)
        .values({
          shortName: data.shortName,
          fullName: data.fullName,
          country: data.country,
          region: data.region,
          channelType: data.channelType,
          creditCondition: data.creditCondition,
          grade: data.grade,
          customerCode,
          paymentTerm: data.paymentTerm || null,
          continent: data.continent || null,
          salesChannel: data.salesChannel || null,
        })
        .returning({ id: customer.id });

      const newId = result[0].id;
      await this.initCategoryGradesForCustomer(newId);

      return { id: newId };
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message.includes('duplicate key')
      ) {
        this.logger.warn(
          `Duplicate customer shortName: ${data.shortName}`,
        );
        throw new ConflictException(
          `客户简称 "${data.shortName}" 已存在`,
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    data: {
      shortName: string;
      fullName: string;
      country: string;
      region: string;
      channelType: string;
      creditCondition: string;
      grade: string;
      customerCode?: string;
      paymentTerm?: string;
      continent?: string;
      salesChannel?: string;
    },
    userId?: string,
    roles?: string[],
    userRegion?: string,
  ) {
    // 非超管用户更新客户时，region 强制为当前用户所属区域
    const isSuperAdmin = roles?.includes('super_admin');
    if (!isSuperAdmin && userRegion) {
      data.region = userRegion;
    }
    try {
      const result = await this.db
        .update(customer)
        .set({
          shortName: data.shortName,
          fullName: data.fullName,
          country: data.country,
          region: data.region,
          channelType: data.channelType,
          creditCondition: data.creditCondition,
          grade: data.grade,
          customerCode: data.customerCode || null,
          paymentTerm: data.paymentTerm || null,
          continent: data.continent || null,
          salesChannel: data.salesChannel || null,
        })
        .where(eq(customer.id, id))
        .returning({ id: customer.id });

      if (result.length === 0) {
        throw new NotFoundException(`客户 ${id} 不存在`);
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
          `Duplicate customer shortName: ${data.shortName}`,
        );
        throw new ConflictException(
          `客户简称 "${data.shortName}" 已存在`,
        );
      }
      throw error;
    }
  }

  async remove(id: string) {
    const result = await this.db
      .delete(customer)
      .where(eq(customer.id, id))
      .returning({ id: customer.id });

    if (result.length === 0) {
      throw new NotFoundException(`客户 ${id} 不存在`);
    }

    return { success: true };
  }

  private async getCategoryNames(): Promise<string[]> {
    const rows = await this.db
      .select({ name: productCategory.name })
      .from(productCategory)
      .orderBy(productCategory.sortOrder, productCategory.id);
    if (rows.length > 0) return rows.map((r) => r.name);
    return PRODUCT_CATEGORIES.slice() as string[];
  }

  async getCategoryGrades(customerId: string) {
    const categoryNames = await this.getCategoryNames();
    const rows = await this.db
      .select({
        id: customerCategoryGrade.id,
        customerId: customerCategoryGrade.customerId,
        category: customerCategoryGrade.category,
        grade: customerCategoryGrade.grade,
      })
      .from(customerCategoryGrade)
      .where(eq(customerCategoryGrade.customerId, customerId));

    // 如果所有品类都已存在，直接返回
    if (rows.length >= categoryNames.length) {
      return rows;
    }

    // 兼容历史数据：若行为空，尝试从 customer.grade 回填
    if (rows.length === 0) {
      const customerRows = await this.db
        .select({ grade: customer.grade })
        .from(customer)
        .where(eq(customer.id, customerId))
        .limit(1);
      const legacyGrade = customerRows[0]?.grade;
      if (legacyGrade) {
        const gradesMap: Record<string, string> = {};
        for (const cat of categoryNames) gradesMap[cat] = legacyGrade;
        await this.batchUpsertCategoryGrades(customerId, gradesMap);
        return this.getCategoryGrades(customerId);
      }
      // 无旧等级，初始化默认值
      await this.initCategoryGradesForCustomer(customerId);
      return this.getCategoryGrades(customerId);
    }

    return rows;
  }

  async upsertCategoryGrade(
    customerId: string,
    category: string,
    grade: string,
  ) {
    await this.db
      .insert(customerCategoryGrade)
      .values({ customerId, category, grade })
      .onConflictDoUpdate({
        target: [
          customerCategoryGrade.customerId,
          customerCategoryGrade.category,
        ],
        set: { grade },
      });
  }

  async batchUpsertCategoryGrades(
    customerId: string,
    grades: Record<string, string>,
  ) {
    const entries = Object.entries(grades);
    if (entries.length === 0) return;

    const values = entries.map(
      ([category, grade]: [string, string]) => ({
        customerId,
        category,
        grade,
      }),
    );

    await this.db
      .insert(customerCategoryGrade)
      .values(values)
      .onConflictDoUpdate({
        target: [
          customerCategoryGrade.customerId,
          customerCategoryGrade.category,
        ],
        set: { grade: sql`excluded.grade` },
      });
  }

  async initCategoryGradesForCustomer(
    customerId: string,
    defaultGrade = '无',
  ) {
    const categoryNames = await this.getCategoryNames();
    const values = categoryNames.map((category: string) => ({
      customerId,
      category,
      grade: defaultGrade,
    }));

    await this.db
      .insert(customerCategoryGrade)
      .values(values)
      .onConflictDoNothing();
  }
}
