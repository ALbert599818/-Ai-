import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@server/lib/platform';
import * as schema from '@server/database/schema';
import { eq, and, or, count, desc, like, sql, inArray } from 'drizzle-orm';
import type {
  QuotationCalculateRequest,
  QuotationCalculateResponse,
  SaveQuotationRequest,
  QuotationListParams,
  QuotationListResponse,
  QuotationDetailResponse,
} from '@shared/quotation';
import { calculateQuotation } from './pricing-engine';
import { CustomerService } from '../customer/customer.service';

@Injectable()
export class QuotationService {
  private readonly logger = new Logger(QuotationService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE)
    private readonly db: PostgresJsDatabase,
    private readonly customerService: CustomerService,
  ) {}

  async calculate(request: QuotationCalculateRequest): Promise<QuotationCalculateResponse> {
    return calculateQuotation(this.db, request);
  }

  async save(
    request: SaveQuotationRequest, userId: string, userName: string,
  ): Promise<{ id: string; quotationNo: string }> {
    // Calculate pricing
    const calcResult = await calculateQuotation(this.db, request);

    // Null-safe defaults for optional fields
    const customFees = request.customFees ?? [];
    const logisticsType = request.logisticsType || request.items[0]?.logisticsType || '散货';
    const flexibleReserve = request.flexibleReserve ?? 0;
    const flexibleIsRate = request.flexibleIsRate ?? true;
    const region = request.region || '';

    // Look up customer info for denormalized fields
    let customerFullName = request.customerShortName;
    let customerCountry = request.country || '';

    if (!request.isNewCustomer) {
      const customerRows = await this.db
        .select()
        .from(schema.customer)
        .where(eq(schema.customer.shortName, request.customerShortName))
        .limit(1);
      const cust = customerRows[0];
      if (!cust) {
        throw new BadRequestException(
          `客户 "${request.customerShortName}" 不存在，请先创建客户`,
        );
      }
      customerFullName = cust.fullName;
      customerCountry = cust.country;
    }

    const quotationNo = `QTN${Date.now()}`;

    const result = await this.db.transaction(async (tx) => {
      // Insert quotation header
      const inserted = await tx
        .insert(schema.quotation)
        .values({
          quotationNo, customerShortName: request.customerShortName,
          customerFullName, country: customerCountry, region,
          channelType: request.channelType,
          isNewCustomer: request.isNewCustomer, grade: request.grade,
          gradeCoefficient: String(calcResult.gradeCoefficient),
          sensitivityCoefficient: String(calcResult.sensitivityCoefficient),
          creditCondition: request.creditCondition,
          creditCoefficient: String(calcResult.creditCoefficient),
          insuranceCoefficient: String(calcResult.insuranceCoefficient),
          logisticsType,
          logisticsCoefficient: String(calcResult.logisticsCoefficient),
          exchangeRiskRate: String(calcResult.exchangeRiskRate),
          afterSalesRate: String(calcResult.afterSalesRate),
          marketingExpenseRate: String(calcResult.marketingExpenseRate),
          quantityCoefficient: String(calcResult.quantityCoefficient),
          flexibleReserve: String(flexibleReserve), flexibleIsRate,
          totalAmount: String(calcResult.totalAmount),
          afterSalesSubtotal: String(calcResult.afterSalesSubtotal),
          marketingSubtotal: String(calcResult.marketingSubtotal),
          taxRate: String(calcResult.taxRate),
          status: 'draft', rejectReason: '',
          createdByName: userName,
          createdBy: userId, updatedBy: userId,
        })
        .returning({ id: schema.quotation.id });

      const quotationId = inserted[0].id;

      // Insert quotation items
      if (calcResult.items.length > 0) {
        await tx.insert(schema.quotationItem).values(
          calcResult.items.map((item) => ({
            quotationId,
            model: item.model,
            color: item.color,
            category: item.category,
            productGrade: item.productGrade,
            purchaseCost: String(item.purchaseCost),
            rdCost: String(item.rdCost),
            moq: item.moq,
            quantity: item.quantity,
            targetMargin: String(item.targetMargin),
            unitPrice: String(item.unitPrice),
            totalPrice: String(item.totalPrice),
            actualMargin: String(item.actualMargin),
            alertLevel: item.alertLevel,
            alertMsg: item.alertMsg,
            createdBy: userId,
            updatedBy: userId,
          })),
        );
      }

      // Insert custom fees
      if (customFees.length > 0) {
        await tx.insert(schema.quotationCustomFee).values(
          customFees.map((fee) => ({
            quotationId,
            feeName: fee.feeName,
            feeAmount: String(fee.feeAmount),
            createdBy: userId,
            updatedBy: userId,
          })),
        );
      }

      return { id: quotationId, quotationNo };
    });

    this.logger.log(
      `Saved quotation ${quotationNo} by ${userName}`,
    );
    return result;
  }

  async update(
    id: string, request: SaveQuotationRequest,
    userId: string, userName: string,
  ): Promise<{ success: boolean }> {
    // Verify quotation exists and is in draft status
    const existingRows = await this.db
      .select({ status: schema.quotation.status })
      .from(schema.quotation)
      .where(eq(schema.quotation.id, id))
      .limit(1);

    if (existingRows.length === 0) {
      throw new NotFoundException(`报价单 ${id} 不存在`);
    }
    if (existingRows[0].status !== 'draft') {
      throw new BadRequestException('只有草稿状态的报价单可以更新');
    }

    // Recalculate pricing
    const calcResult = await calculateQuotation(this.db, request);

    // Null-safe defaults for optional fields
    const customFees = request.customFees ?? [];
    const logisticsType = request.logisticsType || request.items[0]?.logisticsType || '散货';
    const flexibleReserve = request.flexibleReserve ?? 0;
    const flexibleIsRate = request.flexibleIsRate ?? true;
    const region = request.region || '';

    // Look up customer info for denormalized fields
    let customerFullName = request.customerShortName;
    let customerCountry = request.country || '';

    if (!request.isNewCustomer) {
      const customerRows = await this.db
        .select()
        .from(schema.customer)
        .where(
          eq(schema.customer.shortName, request.customerShortName),
        )
        .limit(1);
      const cust = customerRows[0];
      if (!cust) {
        throw new BadRequestException(
          `客户 "${request.customerShortName}" 不存在，请先创建客户`,
        );
      }
      customerFullName = cust.fullName;
      customerCountry = cust.country;
    }

    await this.db.transaction(async (tx) => {
      // Update quotation header
      const updated = await tx
        .update(schema.quotation)
        .set({
          customerShortName: request.customerShortName,
          customerFullName, country: customerCountry, region,
          channelType: request.channelType,
          isNewCustomer: request.isNewCustomer, grade: request.grade,
          gradeCoefficient: String(calcResult.gradeCoefficient),
          sensitivityCoefficient: String(calcResult.sensitivityCoefficient),
          creditCondition: request.creditCondition,
          creditCoefficient: String(calcResult.creditCoefficient),
          insuranceCoefficient: String(calcResult.insuranceCoefficient),
          logisticsType,
          logisticsCoefficient: String(calcResult.logisticsCoefficient),
          exchangeRiskRate: String(calcResult.exchangeRiskRate),
          afterSalesRate: String(calcResult.afterSalesRate),
          marketingExpenseRate: String(calcResult.marketingExpenseRate),
          quantityCoefficient: String(calcResult.quantityCoefficient),
          flexibleReserve: String(flexibleReserve), flexibleIsRate,
          totalAmount: String(calcResult.totalAmount),
          afterSalesSubtotal: String(calcResult.afterSalesSubtotal),
          marketingSubtotal: String(calcResult.marketingSubtotal),
          taxRate: String(calcResult.taxRate),
          updatedBy: userId,
        })
        .where(eq(schema.quotation.id, id))
        .returning({ id: schema.quotation.id });

      if (updated.length === 0) {
        throw new NotFoundException(`报价单 ${id} 不存在`);
      }

      // Delete old items and custom fees
      await Promise.all([
        tx
          .delete(schema.quotationItem)
          .where(eq(schema.quotationItem.quotationId, id)),
        tx
          .delete(schema.quotationCustomFee)
          .where(eq(schema.quotationCustomFee.quotationId, id)),
      ]);

      // Re-insert quotation items
      if (calcResult.items.length > 0) {
        await tx.insert(schema.quotationItem).values(
          calcResult.items.map((item) => ({
            quotationId: id,
            model: item.model,
            color: item.color,
            category: item.category,
            productGrade: item.productGrade,
            purchaseCost: String(item.purchaseCost),
            rdCost: String(item.rdCost),
            moq: item.moq,
            quantity: item.quantity,
            targetMargin: String(item.targetMargin),
            unitPrice: String(item.unitPrice),
            totalPrice: String(item.totalPrice),
            actualMargin: String(item.actualMargin),
            alertLevel: item.alertLevel,
            alertMsg: item.alertMsg,
            createdBy: userId,
            updatedBy: userId,
          })),
        );
      }

      // Re-insert custom fees
      if (customFees.length > 0) {
        await tx.insert(schema.quotationCustomFee).values(
          customFees.map((fee) => ({
            quotationId: id,
            feeName: fee.feeName,
            feeAmount: String(fee.feeAmount),
            createdBy: userId,
            updatedBy: userId,
          })),
        );
      }
    });

    this.logger.log(
      `Updated quotation ${id} by ${userName}`,
    );
    return { success: true };
  }

  async findAll(
    params: QuotationListParams,
    userId?: string,
    roles?: string[],
    userRegion?: string,
  ): Promise<QuotationListResponse> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (params.status) {
      conditions.push(eq(schema.quotation.status, params.status));
    }

    if (params.keyword) {
      conditions.push(
        or(
          like(schema.quotation.quotationNo, `%${params.keyword}%`),
          like(
            schema.quotation.customerShortName,
            `%${params.keyword}%`,
          ),
        ),
      );
    }

    const isSuperAdmin = roles?.includes('super_admin') ?? false;
    const isAdmin = roles?.includes('admin') ?? false;
    if (isSuperAdmin) {
      // 超级管理员：查看所有报价单，不受区域限制
    } else if (isAdmin) {
      if (userRegion) {
        conditions.push(
          eq(schema.quotation.region, userRegion),
        );
      } else {
        return { items: [], total: 0 };
      }
    } else if (userId) {
      conditions.push(
        sql`(${schema.quotation.createdBy}).user_id = ${userId}`,
      );
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      this.db
        .select()
        .from(schema.quotation)
        .where(whereClause)
        .orderBy(desc(schema.quotation.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(schema.quotation)
        .where(whereClause),
    ]);

    // Batch fetch item counts for all quotations
    const quotationIds = items.map((q) => q.id);
    let itemCountMap = new Map<string, number>();
    if (quotationIds.length > 0) {
      const itemCounts: { quotationId: string; count: number }[] =
        await this.db
          .select({
            quotationId: schema.quotationItem.quotationId,
            count: count(),
          })
          .from(schema.quotationItem)
          .where(
            inArray(
              schema.quotationItem.quotationId,
              quotationIds,
            ),
          )
          .groupBy(schema.quotationItem.quotationId);

      itemCountMap = new Map(
        itemCounts.map((ic: { quotationId: string; count: number }) => [
          ic.quotationId,
          Number(ic.count),
        ]),
      );
    }

    return {
      items: items.map((q) => ({
        id: q.id,
        quotationNo: q.quotationNo,
        customerShortName: q.customerShortName,
        customerFullName: q.customerFullName,
        totalAmount: Number(q.totalAmount),
        status: q.status,
        createdByName: q.createdByName,
        createdAt: q.createdAt.toISOString(),
        updatedAt: q.updatedAt.toISOString(),
        itemCount: itemCountMap.get(q.id) ?? 0,
      })),
      total: Number(totalResult[0].count),
    };
  }

  async findOne(
    id: string,
    userId?: string,
    roles?: string[],
    userRegion?: string,
  ): Promise<QuotationDetailResponse> {
    const rows = await this.db
      .select()
      .from(schema.quotation)
      .where(eq(schema.quotation.id, id))
      .limit(1);
    const q = rows[0];

    if (!q) {
      throw new NotFoundException(`报价单 ${id} 不存在`);
    }

    const isSuperAdmin = roles?.includes('super_admin') ?? false;
    const isAdmin = roles?.includes('admin') ?? false;
    if (isAdmin && !isSuperAdmin && userRegion && q.region !== userRegion) {
      throw new ForbiddenException('无权查看此报价单');
    }
    if (!isSuperAdmin && !isAdmin && userId && q.createdBy) {
      const creatorId = String(q.createdBy).match(/\(([^,]+)/)?.[1];
      if (creatorId && creatorId !== userId) {
        throw new ForbiddenException('无权查看此报价单');
      }
    }

    const [items, customFees] = await Promise.all([
      this.db
        .select()
        .from(schema.quotationItem)
        .where(eq(schema.quotationItem.quotationId, id)),
      this.db
        .select()
        .from(schema.quotationCustomFee)
        .where(eq(schema.quotationCustomFee.quotationId, id)),
    ]);

    // Recalculate to enrich items with logisticsCoefficient,
    // flexibleReserveAmount, customFeesTotal, customFees, and alert info
    const customFeesFormatted = customFees.map((f) => ({
      feeName: f.feeName,
      feeAmount: Number(f.feeAmount),
    }));

    const toBaseItem = (i: typeof items[number]) => ({
      model: i.model, color: i.color, category: i.category,
      productGrade: i.productGrade,
      purchaseCost: Number(i.purchaseCost),
      rdCost: Number(i.rdCost), moq: i.moq, quantity: i.quantity,
      targetMargin: Number(i.targetMargin),
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
      actualMargin: Number(i.actualMargin),
    });

    let enrichedItems = items.map((i) => ({
      ...toBaseItem(i),
      alertLevel: i.alertLevel as 'none' | 'yellow' | 'red',
      alertMsg: i.alertMsg,
      logisticsCoefficient: 0, flexibleReserveAmount: 0,
      customFeesTotal: 0,
      customFees: [] as { feeName: string; feeAmount: number }[],
    }));

    try {
      const calcReq: QuotationCalculateRequest = {
        customerShortName: q.customerShortName,
        region: q.region, channelType: q.channelType,
        isNewCustomer: q.isNewCustomer, grade: q.grade,
        creditCondition: q.creditCondition,
        logisticsType: q.logisticsType,
        flexibleReserve: Number(q.flexibleReserve),
        flexibleIsRate: q.flexibleIsRate,
        customFees: customFeesFormatted,
        items: items.map((i) => ({
          model: i.model, color: i.color, quantity: i.quantity,
          logisticsType: q.logisticsType,
          flexibleReserve: Number(q.flexibleReserve),
          flexibleIsRate: q.flexibleIsRate,
          customFees: customFeesFormatted,
        })),
      };
      const calcResult = await calculateQuotation(this.db, calcReq);
      enrichedItems = items.map((item, idx) => {
        const c = calcResult.items[idx];
        return {
          ...toBaseItem(item),
          alertLevel: (c?.alertLevel ?? item.alertLevel) as 'none' | 'yellow' | 'red',
          alertMsg: c?.alertMsg ?? item.alertMsg,
          logisticsCoefficient: c?.logisticsCoefficient ?? 0,
          flexibleReserveAmount: c?.flexibleReserveAmount ?? 0,
          customFeesTotal: c?.customFeesTotal ?? 0,
          customFees: c?.customFees ?? [],
        };
      });
    } catch (err) {
      this.logger.warn(
        `Failed to recalculate quotation ${id}, using stored values: ` +
          JSON.stringify(err),
      );
    }

    return {
      id: q.id, quotationNo: q.quotationNo,
      customerShortName: q.customerShortName,
      customerFullName: q.customerFullName,
      country: q.country, region: q.region,
      channelType: q.channelType,
      isNewCustomer: q.isNewCustomer, grade: q.grade,
      gradeCoefficient: Number(q.gradeCoefficient),
      sensitivityCoefficient: Number(q.sensitivityCoefficient),
      creditCondition: q.creditCondition,
      creditCoefficient: Number(q.creditCoefficient),
      insuranceCoefficient: Number(q.insuranceCoefficient),
      logisticsType: q.logisticsType,
      logisticsCoefficient: Number(q.logisticsCoefficient),
      exchangeRiskRate: Number(q.exchangeRiskRate),
      afterSalesRate: Number(q.afterSalesRate),
      marketingExpenseRate: Number(q.marketingExpenseRate),
      quantityCoefficient: Number(q.quantityCoefficient),
      flexibleReserve: Number(q.flexibleReserve),
      flexibleIsRate: q.flexibleIsRate,
      totalAmount: Number(q.totalAmount),
      afterSalesSubtotal: Number(q.afterSalesSubtotal),
      marketingSubtotal: Number(q.marketingSubtotal),
      taxRate: Number(q.taxRate),
      status: q.status, rejectReason: q.rejectReason,
      createdByName: q.createdByName,
      createdAt: q.createdAt.toISOString(),
      items: enrichedItems,
      customFees: customFeesFormatted,
    };
  }

  async remove(
    id: string,
    userId?: string,
    roles?: string[],
    _region?: string,
  ): Promise<{ success: boolean }> {
    const isAdmin = roles?.includes('admin') || roles?.includes('super_admin');
    if (!isAdmin && userId) {
      const rows = await this.db
        .select({ createdBy: schema.quotation.createdBy })
        .from(schema.quotation)
        .where(eq(schema.quotation.id, id))
        .limit(1);
      if (rows.length === 0) {
        throw new NotFoundException(`报价单 ${id} 不存在`);
      }
      const creatorId = String(rows[0].createdBy).match(/\(([^,]+)/)?.[1];
      if (creatorId && creatorId !== userId) {
        throw new ForbiddenException('无权删除此报价单');
      }
    }

    const deleted = await this.db
      .delete(schema.quotation)
      .where(eq(schema.quotation.id, id))
      .returning({ id: schema.quotation.id });

    if (deleted.length === 0) {
      throw new NotFoundException(`报价单 ${id} 不存在`);
    }

    await Promise.all([
      this.db
        .delete(schema.quotationItem)
        .where(eq(schema.quotationItem.quotationId, id)),
      this.db
        .delete(schema.quotationCustomFee)
        .where(eq(schema.quotationCustomFee.quotationId, id)),
    ]);

    this.logger.log(`Deleted quotation ${id}`);
    return { success: true };
  }

  async submit(
    id: string,
    userId?: string,
    roles?: string[],
    _region?: string,
  ): Promise<{ success: boolean }> {
    const rows = await this.db
      .select({
        status: schema.quotation.status,
        createdBy: schema.quotation.createdBy,
      })
      .from(schema.quotation)
      .where(eq(schema.quotation.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException(`报价单 ${id} 不存在`);
    }

    if (rows[0].status !== 'draft') {
      throw new BadRequestException('只有草稿状态的报价单可以提交');
    }

    const isAdmin = roles?.includes('admin') || roles?.includes('super_admin');
    if (!isAdmin && userId) {
      const creatorId = String(rows[0].createdBy).match(/\(([^,]+)/)?.[1];
      if (creatorId && creatorId !== userId) {
        throw new ForbiddenException('无权提交此报价单');
      }
    }

    await this.db.transaction(async (tx) => {
      await tx
        .update(schema.quotation)
        .set({ status: 'submitted' })
        .where(eq(schema.quotation.id, id));

      // Auto-generate customer code for new customers without one
      const qRows = await tx
        .select({
          customerShortName: schema.quotation.customerShortName,
          isNewCustomer: schema.quotation.isNewCustomer,
        })
        .from(schema.quotation)
        .where(eq(schema.quotation.id, id))
        .limit(1);

      if (qRows.length > 0) {
        const customerRows = await tx
          .select({
            id: schema.customer.id,
            customerCode: schema.customer.customerCode,
          })
          .from(schema.customer)
          .where(
            eq(
              schema.customer.shortName,
              qRows[0].customerShortName,
            ),
          )
          .limit(1);

        if (
          customerRows.length > 0 &&
          !customerRows[0].customerCode
        ) {
          // Generate customer code using transaction connection to avoid deadlock
          const today = new Date();
          const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
          const prefix = `C${dateStr}`;
          const countResult = await tx
            .select({ count: count() })
            .from(schema.customer)
            .where(like(schema.customer.customerCode, `${prefix}%`));
          const seq = (Number(countResult[0]?.count ?? 0)) + 1;
          const code = `${prefix}${String(seq).padStart(4, '0')}`;

          await tx
            .update(schema.customer)
            .set({ customerCode: code })
            .where(eq(schema.customer.id, customerRows[0].id));
          this.logger.log(
            `Auto-generated customer code ${code} for ${qRows[0].customerShortName}`,
          );
        }
      }
    });

    this.logger.log(`Submitted quotation ${id}`);
    return { success: true };
  }

  async approve(id: string): Promise<{ success: boolean }> {
    const updated = await this.db
      .update(schema.quotation)
      .set({ status: 'approved' })
      .where(
        and(
          eq(schema.quotation.id, id),
          sql`${schema.quotation.status} != 'approved'`,
        ),
      )
      .returning({
        id: schema.quotation.id,
      });

    if (updated.length === 0) {
      throw new BadRequestException('报价单不存在或状态不允许审批');
    }

    this.logger.log(`Approved quotation ${id}`);
    return { success: true };
  }

  async resubmit(id: string): Promise<{ success: boolean }> {
    const rows = await this.db
      .select({
        status: schema.quotation.status,
      })
      .from(schema.quotation)
      .where(eq(schema.quotation.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException(`报价单 ${id} 不存在`);
    }

    const q = rows[0];

    if (q.status !== 'approved' && q.status !== 'rejected') {
      throw new BadRequestException('只有已审批或已驳回的报价单可以退回待审批');
    }

    await this.db
      .update(schema.quotation)
      .set({ status: 'submitted', rejectReason: '' })
      .where(eq(schema.quotation.id, id));

    this.logger.log(`Resubmitted quotation ${id}`);
    return { success: true };
  }

  async reject(
    id: string,
    reason: string,
  ): Promise<{ success: boolean }> {
    const existing = await this.db
      .select({ status: schema.quotation.status })
      .from(schema.quotation)
      .where(eq(schema.quotation.id, id))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException(`报价单 ${id} 不存在`);
    }

    if (existing[0].status !== 'submitted') {
      throw new BadRequestException('只有待审批状态的报价单可以驳回');
    }

    const updated = await this.db
      .update(schema.quotation)
      .set({ status: 'rejected', rejectReason: reason })
      .where(eq(schema.quotation.id, id))
      .returning({
        id: schema.quotation.id,
      });

    if (updated.length === 0) {
      throw new NotFoundException(`报价单 ${id} 不存在`);
    }

    this.logger.log(`Rejected quotation ${id}: ${reason}`);
    return { success: true };
  }
}
