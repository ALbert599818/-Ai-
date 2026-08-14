/* eslint-disable */
/** auto generated, do not edit */
import { sql } from 'drizzle-orm';
import { bigint, boolean, foreignKey, index, integer, jsonb, numeric, pgTable, text, uniqueIndex, uuid, varchar, customType } from "drizzle-orm/pg-core"

export const customTimestamptz = customType<{
  data: Date;
  driverData: string;
  config: { precision?: number };
}>({
  dataType(config) {
    const precision = typeof config?.precision !== 'undefined'
      ? ` (${config.precision})`
      : '';
    return `timestamptz${precision}`;
  },
  toDriver(value: Date | string | number) {
    if (value == null) return value as any;
    if (typeof value === 'number') return new Date(value).toISOString();
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    throw new Error('Invalid timestamp value');
  },
  fromDriver(value: string | Date): Date {
    if (value instanceof Date) return value;
    return new Date(value);
  },
});

export const userProfile = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return 'user_profile';
  },
  toDriver(value: string) {
    return sql`ROW(${value})::user_profile`;
  },
  fromDriver(value: string) {
    const [userId] = value.slice(1, -1).split(',');
    return userId.trim();
  },
});

export type FileAttachment = {
  bucket_id: string;
  file_path: string;
};

export const fileAttachment = customType<{
  data: FileAttachment;
  driverData: string;
}>({
  dataType() {
    return 'file_attachment';
  },
  toDriver(value: FileAttachment) {
    return sql`ROW(${value.bucket_id},${value.file_path})::file_attachment`;
  },
  fromDriver(value: string): FileAttachment {
    const [bucketId, filePath] = value.slice(1, -1).split(',');
    return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
  },
});

export function escapeLiteral(str: string): string {
  return "'" + str.replace(/'/g, "''") + "'";
}

export const userProfileArray = customType<{
  data: string[];
  driverData: string;
}>({
  dataType() {
    return 'user_profile[]';
  },
  toDriver(value: string[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::user_profile[]`;
    }
    const elements = value.map(id => `ROW(${escapeLiteral(id)})::user_profile`).join(',');
    return sql.raw(`ARRAY[${elements}]::user_profile[]`);
  },
  fromDriver(value: string): string[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => m.slice(1, -1).split(',')[0].trim());
  },
});

export const fileAttachmentArray = customType<{
  data: FileAttachment[];
  driverData: string;
}>({
  dataType() {
    return 'file_attachment[]';
  },
  toDriver(value: FileAttachment[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::file_attachment[]`;
    }
    const elements = value.map(f =>
      `ROW(${escapeLiteral(f.bucket_id)},${escapeLiteral(f.file_path)})::file_attachment`
    ).join(',');
    return sql.raw(`ARRAY[${elements}]::file_attachment[]`);
  },
  fromDriver(value: string): FileAttachment[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => {
      const [bucketId, filePath] = m.slice(1, -1).split(',');
      return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
    });
  },
});

export const productCategory = pgTable("product_category", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  defaultGrade: varchar("default_grade", { length: 20 }).notNull().default('无'),
  sortOrder: integer("sort_order").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("product_category_name_key").on(table.name),
]);

export const customerCategoryGrade = pgTable("customer_category_grade", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  grade: varchar("grade", { length: 20 }).notNull().default('无'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("idx_customer_category_unique").on(table.customerId, table.category),
  foreignKey({
    columns: [table.customerId],
    foreignColumns: [customer.id],
    name: "customer_category_grade_customer_id_fkey",
  }).onDelete("cascade"),
]);

export const pricingFormulaConfig = pgTable("pricing_formula_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  configKey: varchar("config_key", { length: 100 }).notNull().unique(),
  /**
   * @type { gradeFactor?: number; sensitivityFactor?: number; logisticsFactor?: number; insuranceFactor?: number; creditFactor?: number; quantityFactor?: number; exchangeRiskRate?: number; defaultTargetMargin?: number; formulaVersion?: string; [key: string]: any }
   */
  configValue: jsonb("config_value").notNull().default('{}'),
  description: varchar("description", { length: 500 }).notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("pricing_formula_config_config_key_key").on(table.configKey),
]);

export const marketingExpensePoolRecord = pgTable("marketing_expense_pool_record", {
  id: uuid("id").primaryKey().defaultRandom(),
  poolId: uuid("pool_id").notNull(),
  quotationId: uuid("quotation_id"),
  type: varchar("type", { length: 20 }).notNull(),
  amount: numeric("amount").notNull(),
  reason: varchar("reason", { length: 500 }).notNull(),
  operatorName: varchar("operator_name", { length: 100 }).notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_mepr_pool_id").on(table.poolId),
  index("idx_mepr_quotation_id").on(table.quotationId),
]);

export const marketingExpensePool = pgTable("marketing_expense_pool", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerShortName: varchar("customer_short_name", { length: 200 }).notNull().unique(),
  balance: numeric("balance").notNull().default('0'),
  totalAdded: numeric("total_added").notNull().default('0'),
  totalDeducted: numeric("total_deducted").notNull().default('0'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("idx_mep_customer").on(table.customerShortName),
]);

export const afterSalesPoolRecord = pgTable("after_sales_pool_record", {
  id: uuid("id").primaryKey().defaultRandom(),
  poolId: uuid("pool_id").notNull(),
  quotationId: uuid("quotation_id"),
  type: varchar("type", { length: 20 }).notNull(),
  amount: numeric("amount").notNull(),
  reason: varchar("reason", { length: 500 }).notNull(),
  operatorName: varchar("operator_name", { length: 100 }).notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_aspr_pool_id").on(table.poolId),
  index("idx_aspr_quotation_id").on(table.quotationId),
]);

export const afterSalesPool = pgTable("after_sales_pool", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerShortName: varchar("customer_short_name", { length: 200 }).notNull().unique(),
  balance: numeric("balance").notNull().default('0'),
  totalAdded: numeric("total_added").notNull().default('0'),
  totalDeducted: numeric("total_deducted").notNull().default('0'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("idx_after_sales_pool_customer").on(table.customerShortName),
]);

export const quotationCustomFee = pgTable("quotation_custom_fee", {
  id: uuid("id").primaryKey().defaultRandom(),
  quotationId: uuid("quotation_id").notNull(),
  feeName: varchar("fee_name", { length: 200 }).notNull(),
  feeAmount: numeric("fee_amount").notNull().default('0'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_quotation_custom_fee_quotation_id").on(table.quotationId),
]);

export const quotationItem = pgTable("quotation_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  quotationId: uuid("quotation_id").notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  color: varchar("color", { length: 100 }).notNull(),
  category: varchar("category", { length: 200 }).notNull(),
  productGrade: varchar("product_grade", { length: 20 }).notNull(),
  purchaseCost: numeric("purchase_cost").notNull().default('0'),
  rdCost: numeric("rd_cost").notNull().default('0'),
  moq: integer("moq").notNull().default(0),
  quantity: integer("quantity").notNull().default(0),
  targetMargin: numeric("target_margin").notNull().default('0.30'),
  unitPrice: numeric("unit_price").notNull().default('0'),
  totalPrice: numeric("total_price").notNull().default('0'),
  actualMargin: numeric("actual_margin").notNull().default('0'),
  alertLevel: varchar("alert_level", { length: 20 }).notNull().default('none'),
  alertMsg: varchar("alert_msg", { length: 500 }).notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_quotation_item_quotation_id").on(table.quotationId),
]);

export const quotation = pgTable("quotation", {
  id: uuid("id").primaryKey().defaultRandom(),
  quotationNo: varchar("quotation_no", { length: 50 }).notNull().unique(),
  customerShortName: varchar("customer_short_name", { length: 200 }).notNull(),
  customerFullName: varchar("customer_full_name", { length: 500 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  region: varchar("region", { length: 50 }).notNull(),
  channelType: varchar("channel_type", { length: 50 }).notNull(),
  isNewCustomer: boolean("is_new_customer").notNull().default(true),
  grade: varchar("grade", { length: 20 }).notNull(),
  gradeCoefficient: numeric("grade_coefficient").notNull().default('0'),
  sensitivityCoefficient: numeric("sensitivity_coefficient").notNull().default('0'),
  creditCondition: varchar("credit_condition", { length: 200 }).notNull(),
  creditCoefficient: numeric("credit_coefficient").notNull().default('0'),
  insuranceCoefficient: numeric("insurance_coefficient").notNull().default('0'),
  logisticsType: varchar("logistics_type", { length: 100 }).notNull(),
  logisticsCoefficient: numeric("logistics_coefficient").notNull().default('0'),
  exchangeRiskRate: numeric("exchange_risk_rate").notNull().default('0.02'),
  afterSalesRate: numeric("after_sales_rate").notNull().default('0'),
  marketingExpenseRate: numeric("marketing_expense_rate").notNull().default('0'),
  quantityCoefficient: numeric("quantity_coefficient").notNull().default('1'),
  flexibleReserve: numeric("flexible_reserve").notNull().default('0'),
  flexibleIsRate: boolean("flexible_is_rate").notNull().default(true),
  totalAmount: numeric("total_amount").notNull().default('0'),
  afterSalesSubtotal: numeric("after_sales_subtotal").notNull().default('0'),
  marketingSubtotal: numeric("marketing_subtotal").notNull().default('0'),
  taxRate: numeric("tax_rate").notNull().default('0.13'),
  status: varchar("status", { length: 20 }).notNull().default('draft'),
  rejectReason: varchar("reject_reason", { length: 1000 }).notNull(),
  createdByName: varchar("created_by_name", { length: 100 }).notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("idx_quotation_no").on(table.quotationNo),
  index("idx_quotation_status").on(table.status),
]);

export const fileRecord = pgTable("file_record", {
  id: uuid("id").primaryKey().defaultRandom(),
  fileName: varchar("file_name", { length: 500 }).notNull(),
  filePath: varchar("file_path", { length: 1000 }).notNull(),
  downloadUrl: text("download_url").notNull(),
  fileSize: bigint("file_size", { mode: 'number' }).notNull().default(0),
  mimeType: varchar("mime_type", { length: 200 }).notNull(),
  folderPath: varchar("folder_path", { length: 1000 }).notNull(),
  uploadStatus: varchar("upload_status", { length: 20 }).notNull().default('success'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_file_record_folder_path").on(table.folderPath),
  index("idx_file_record_upload_status").on(table.uploadStatus),
]);

export const customer = pgTable("customer", {
  id: uuid("id").primaryKey().defaultRandom(),
  shortName: varchar("short_name", { length: 200 }).notNull().unique(),
  fullName: varchar("full_name", { length: 500 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  region: varchar("region", { length: 50 }).notNull(),
  channelType: varchar("channel_type", { length: 50 }).notNull(),
  creditCondition: varchar("credit_condition", { length: 200 }).notNull(),
  grade: varchar("grade", { length: 20 }).notNull(),
  customerCode: varchar("customer_code", { length: 100 }).unique(),
  paymentTerm: varchar("payment_term", { length: 500 }),
  continent: varchar("continent", { length: 100 }),
  salesChannel: varchar("sales_channel", { length: 100 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("idx_customer_short_name").on(table.shortName),
  uniqueIndex("idx_customer_code_unique").on(table.customerCode),
]);

export const productGradeMargin = pgTable("product_grade_margin", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: varchar("category", { length: 100 }).notNull(),
  customerLevelId: uuid("customer_level_id").notNull(),
  targetMargin: numeric("target_margin").notNull(),
  marginRedline: numeric("margin_redline").notNull().default('0.80'),
  salesRatio: numeric("sales_ratio").notNull(),
  marginContribution: numeric("margin_contribution").notNull(),
  productGrade: varchar("product_grade", { length: 20 }).notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("idx_product_grade_margin_category_level").on(table.category, table.customerLevelId),
]);

export const product = pgTable("product", {
  id: uuid("id").primaryKey().defaultRandom(),
  model: varchar("model", { length: 100 }).notNull(),
  color: varchar("color", { length: 100 }).notNull(),
  purchasePrice: numeric("purchase_price").notNull(),
  moq: integer("moq").notNull(),
  category: varchar("category", { length: 200 }).notNull(),
  productGrade: varchar("product_grade", { length: 20 }).notNull(),
  rdCost: numeric("rd_cost").notNull().default('0'),
  isNewProduct: boolean("is_new_product").notNull().default(true),
  code: varchar("code", { length: 100 }).unique(),
  series: varchar("series", { length: 100 }),
  erpCategory: varchar("erp_category", { length: 100 }),
  purchaseCost: numeric("purchase_cost"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("idx_product_model_color").on(table.model, table.color),
  uniqueIndex("idx_product_code_unique").on(table.code),
]);

export const otherDiscount = pgTable("other_discount", {
  id: uuid("id").primaryKey().defaultRandom(),
  discountType: varchar("discount_type", { length: 100 }).notNull(),
  discount: numeric("discount").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const logisticsCost = pgTable("logistics_cost", {
  id: uuid("id").primaryKey().defaultRandom(),
  costType: varchar("cost_type", { length: 100 }).notNull(),
  discount: numeric("discount").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const purchaseQuantity = pgTable("purchase_quantity", {
  id: uuid("id").primaryKey().defaultRandom(),
  typeDesc: varchar("type_desc", { length: 200 }).notNull(),
  discount: numeric("discount").notNull(),
  minMultiple: numeric("min_multiple").notNull().default('0'),
  maxMultiple: numeric("max_multiple").notNull().default('0'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const creditTerm = pgTable("credit_term", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: varchar("category", { length: 100 }).notNull(),
  subItem: varchar("sub_item", { length: 200 }).notNull(),
  discount: numeric("discount").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const priceSensitivity = pgTable("price_sensitivity", {
  id: uuid("id").primaryKey().defaultRandom(),
  region: varchar("region", { length: 100 }).notNull(),
  mode: varchar("mode", { length: 20 }).notNull(),
  discount: numeric("discount").notNull(),
  channelType: varchar("channel_type", { length: 20 }).notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("idx_price_sensitivity_region_mode").on(table.region, table.mode),
]);

export const customerLevel = pgTable("customer_level", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  discount: numeric("discount").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("idx_customer_level_name").on(table.name),
]);

export const insuranceCoefficient = pgTable("insurance_coefficient", {
  id: uuid("id").primaryKey().defaultRandom(),
  creditCondition: varchar("credit_condition", { length: 200 }).notNull().unique(),
  coefficient: numeric("coefficient").notNull().default('0'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("idx_insurance_credit").on(table.creditCondition),
]);

export const exchangeRiskRate = pgTable("exchange_risk_rate", {
  id: uuid("id").primaryKey().defaultRandom(),
  rate: numeric("rate").notNull().default('0.02'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const afterSalesReserve = pgTable("after_sales_reserve", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerShortName: varchar("customer_short_name", { length: 200 }).notNull().unique(),
  rate: numeric("rate").notNull().default('0'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("idx_after_sales_customer").on(table.customerShortName),
]);

export const excessMarketingExpense = pgTable("excess_marketing_expense", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerShortName: varchar("customer_short_name", { length: 200 }).notNull().unique(),
  rate: numeric("rate").notNull().default('0'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("idx_excess_marketing_customer").on(table.customerShortName),
]);

export const taxRate = pgTable("tax_rate", {
  id: uuid("id").primaryKey().defaultRandom(),
  rate: numeric("rate").notNull().default('0.13'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const customFeeConfig = pgTable("custom_fee_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull().unique(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("idx_custom_fee_config_name").on(table.name),
]);

export const grossMarginTargetOld = pgTable("gross_margin_target_old", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerShortName: varchar("customer_short_name", { length: 200 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  targetMargin: numeric("target_margin").notNull().default('0.30'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("idx_margin_old_customer_model").on(table.customerShortName, table.model),
]);

export const channelType = pgTable("channel_type", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("idx_channel_type_name").on(table.name),
]);

export const alertThreshold = pgTable("alert_threshold", {
  id: uuid("id").primaryKey().defaultRandom(),
  highPercent: numeric("high_percent").notNull().default('0.80'),
  midPercent: numeric("mid_percent").notNull().default('0.10'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const userAccount = pgTable("user_account", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userProfile("user_id").notNull(),
  username: varchar("username", { length: 100 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  region: varchar("region", { length: 50 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  roles: text("roles").array().notNull().default([]),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  // Complex index: CREATE UNIQUE INDEX idx_user_account_user_id ON user_account USING btree (((user_id).user_id)),
]);

// table aliases
export const afterSalesPoolTable = afterSalesPool;
export const afterSalesPoolRecordTable = afterSalesPoolRecord;
export const afterSalesReserveTable = afterSalesReserve;
export const alertThresholdTable = alertThreshold;
export const channelTypeTable = channelType;
export const creditTermTable = creditTerm;
export const customFeeConfigTable = customFeeConfig;
export const customerTable = customer;
export const customerCategoryGradeTable = customerCategoryGrade;
export const customerLevelTable = customerLevel;
export const excessMarketingExpenseTable = excessMarketingExpense;
export const exchangeRiskRateTable = exchangeRiskRate;
export const fileRecordTable = fileRecord;
export const grossMarginTargetOldTable = grossMarginTargetOld;
export const insuranceCoefficientTable = insuranceCoefficient;
export const logisticsCostTable = logisticsCost;
export const marketingExpensePoolTable = marketingExpensePool;
export const marketingExpensePoolRecordTable = marketingExpensePoolRecord;
export const otherDiscountTable = otherDiscount;
export const priceSensitivityTable = priceSensitivity;
export const pricingFormulaConfigTable = pricingFormulaConfig;
export const productTable = product;
export const productCategoryTable = productCategory;
export const productGradeMarginTable = productGradeMargin;
export const purchaseQuantityTable = purchaseQuantity;
export const quotationTable = quotation;
export const quotationCustomFeeTable = quotationCustomFee;
export const quotationItemTable = quotationItem;
export const taxRateTable = taxRate;
export const userAccountTable = userAccount;
