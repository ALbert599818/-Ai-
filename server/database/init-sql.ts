/**
 * 幂等的建库/建表 SQL（替代飞书 SUDA 数据库）。
 * 启动时逐条执行，可重复运行。
 *
 * 说明：
 * - user_profile / file_attachment 是飞书平台的自定义复合类型，此处按同等结构重建，
 *   保证既有 schema（user_profile 列、`(col).user_id` 访问）无需改动即可运行。
 * - 所有审计列（_created_by/_updated_by）在没有登录态注入 GUC 时恒为 NULL，
 *   业务逻辑不读取这些列，不影响功能。
 */
export const INIT_SQL_STATEMENTS: string[] = [
  `CREATE EXTENSION IF NOT EXISTS pgcrypto`,

  // CREATE TYPE 不支持 IF NOT EXISTS，改用 DO 块做幂等创建
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_profile') THEN
      EXECUTE 'CREATE TYPE user_profile AS (user_id text)';
    END IF;
  END $$;`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'file_attachment') THEN
      EXECUTE 'CREATE TYPE file_attachment AS (bucket_id text, file_path text)';
    END IF;
  END $$;`,

  // ---- customer（先建，供 customer_category_grade 外键引用）----
  `CREATE TABLE IF NOT EXISTS customer (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    short_name varchar(200) NOT NULL,
    full_name varchar(500) NOT NULL,
    country varchar(100) NOT NULL,
    region varchar(50) NOT NULL,
    channel_type varchar(50) NOT NULL,
    credit_condition varchar(200) NOT NULL,
    grade varchar(20) NOT NULL,
    customer_code varchar(100),
    payment_term varchar(500),
    continent varchar(100),
    sales_channel varchar(100),
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  `CREATE TABLE IF NOT EXISTS customer_category_grade (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL REFERENCES customer(id) ON DELETE CASCADE,
    category varchar(50) NOT NULL,
    grade varchar(20) NOT NULL DEFAULT '无',
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  `CREATE TABLE IF NOT EXISTS product_category (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(100) NOT NULL,
    default_grade varchar(20) NOT NULL DEFAULT '无',
    sort_order integer NOT NULL DEFAULT 0,
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  `CREATE TABLE IF NOT EXISTS pricing_formula_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key varchar(100) NOT NULL,
    config_value jsonb NOT NULL DEFAULT '{}'::jsonb,
    description varchar(500) NOT NULL,
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  `CREATE TABLE IF NOT EXISTS marketing_expense_pool (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_short_name varchar(200) NOT NULL,
    balance numeric NOT NULL DEFAULT 0,
    total_added numeric NOT NULL DEFAULT 0,
    total_deducted numeric NOT NULL DEFAULT 0,
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  `CREATE TABLE IF NOT EXISTS marketing_expense_pool_record (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id uuid NOT NULL,
    quotation_id uuid,
    type varchar(20) NOT NULL,
    amount numeric NOT NULL,
    reason varchar(500) NOT NULL,
    operator_name varchar(100) NOT NULL,
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  `CREATE TABLE IF NOT EXISTS after_sales_pool (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_short_name varchar(200) NOT NULL,
    balance numeric NOT NULL DEFAULT 0,
    total_added numeric NOT NULL DEFAULT 0,
    total_deducted numeric NOT NULL DEFAULT 0,
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  `CREATE TABLE IF NOT EXISTS after_sales_pool_record (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id uuid NOT NULL,
    quotation_id uuid,
    type varchar(20) NOT NULL,
    amount numeric NOT NULL,
    reason varchar(500) NOT NULL,
    operator_name varchar(100) NOT NULL,
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  `CREATE TABLE IF NOT EXISTS quotation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_no varchar(50) NOT NULL,
    customer_short_name varchar(200) NOT NULL,
    customer_full_name varchar(500) NOT NULL,
    country varchar(100) NOT NULL,
    region varchar(50) NOT NULL,
    channel_type varchar(50) NOT NULL,
    is_new_customer boolean NOT NULL DEFAULT true,
    grade varchar(20) NOT NULL,
    grade_coefficient numeric NOT NULL DEFAULT 0,
    sensitivity_coefficient numeric NOT NULL DEFAULT 0,
    credit_condition varchar(200) NOT NULL,
    credit_coefficient numeric NOT NULL DEFAULT 0,
    insurance_coefficient numeric NOT NULL DEFAULT 0,
    logistics_type varchar(100) NOT NULL,
    logistics_coefficient numeric NOT NULL DEFAULT 0,
    exchange_risk_rate numeric NOT NULL DEFAULT 0.02,
    after_sales_rate numeric NOT NULL DEFAULT 0,
    marketing_expense_rate numeric NOT NULL DEFAULT 0,
    quantity_coefficient numeric NOT NULL DEFAULT 1,
    flexible_reserve numeric NOT NULL DEFAULT 0,
    flexible_is_rate boolean NOT NULL DEFAULT true,
    total_amount numeric NOT NULL DEFAULT 0,
    after_sales_subtotal numeric NOT NULL DEFAULT 0,
    marketing_subtotal numeric NOT NULL DEFAULT 0,
    tax_rate numeric NOT NULL DEFAULT 0.13,
    status varchar(20) NOT NULL DEFAULT 'draft',
    reject_reason varchar(1000) NOT NULL,
    created_by_name varchar(100) NOT NULL,
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  `CREATE TABLE IF NOT EXISTS quotation_item (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id uuid NOT NULL,
    model varchar(100) NOT NULL,
    color varchar(100) NOT NULL,
    category varchar(200) NOT NULL,
    product_grade varchar(20) NOT NULL,
    purchase_cost numeric NOT NULL DEFAULT 0,
    rd_cost numeric NOT NULL DEFAULT 0,
    moq integer NOT NULL DEFAULT 0,
    quantity integer NOT NULL DEFAULT 0,
    target_margin numeric NOT NULL DEFAULT 0.30,
    unit_price numeric NOT NULL DEFAULT 0,
    total_price numeric NOT NULL DEFAULT 0,
    actual_margin numeric NOT NULL DEFAULT 0,
    alert_level varchar(20) NOT NULL DEFAULT 'none',
    alert_msg varchar(500) NOT NULL,
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  `CREATE TABLE IF NOT EXISTS quotation_custom_fee (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id uuid NOT NULL,
    fee_name varchar(200) NOT NULL,
    fee_amount numeric NOT NULL DEFAULT 0,
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  `CREATE TABLE IF NOT EXISTS file_record (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name varchar(500) NOT NULL,
    file_path varchar(1000) NOT NULL,
    download_url text NOT NULL,
    file_size bigint NOT NULL DEFAULT 0,
    mime_type varchar(200) NOT NULL,
    folder_path varchar(1000) NOT NULL,
    upload_status varchar(20) NOT NULL DEFAULT 'success',
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  `CREATE TABLE IF NOT EXISTS product (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model varchar(100) NOT NULL,
    color varchar(100) NOT NULL,
    purchase_price numeric NOT NULL,
    moq integer NOT NULL,
    category varchar(200) NOT NULL,
    product_grade varchar(20) NOT NULL,
    rd_cost numeric NOT NULL DEFAULT 0,
    is_new_product boolean NOT NULL DEFAULT true,
    code varchar(100),
    series varchar(100),
    erp_category varchar(100),
    purchase_cost numeric,
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  `CREATE TABLE IF NOT EXISTS product_grade_margin (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category varchar(100) NOT NULL,
    customer_level_id uuid NOT NULL,
    target_margin numeric NOT NULL,
    margin_redline numeric NOT NULL DEFAULT 0.80,
    sales_ratio numeric NOT NULL,
    margin_contribution numeric NOT NULL,
    product_grade varchar(20) NOT NULL,
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  `CREATE TABLE IF NOT EXISTS other_discount (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    discount_type varchar(100) NOT NULL,
    discount numeric NOT NULL,
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  `CREATE TABLE IF NOT EXISTS logistics_cost (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cost_type varchar(100) NOT NULL,
    discount numeric NOT NULL,
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  `CREATE TABLE IF NOT EXISTS purchase_quantity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type_desc varchar(200) NOT NULL,
    discount numeric NOT NULL,
    min_multiple numeric NOT NULL DEFAULT 0,
    max_multiple numeric NOT NULL DEFAULT 0,
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  `CREATE TABLE IF NOT EXISTS credit_term (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category varchar(100) NOT NULL,
    sub_item varchar(200) NOT NULL,
    discount numeric NOT NULL,
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  `CREATE TABLE IF NOT EXISTS price_sensitivity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    region varchar(100) NOT NULL,
    mode varchar(20) NOT NULL,
    discount numeric NOT NULL,
    channel_type varchar(20) NOT NULL,
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  `CREATE TABLE IF NOT EXISTS customer_level (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(100) NOT NULL,
    discount numeric NOT NULL,
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  `CREATE TABLE IF NOT EXISTS insurance_coefficient (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_condition varchar(200) NOT NULL,
    coefficient numeric NOT NULL DEFAULT 0,
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  `CREATE TABLE IF NOT EXISTS exchange_risk_rate (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rate numeric NOT NULL DEFAULT 0.02,
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  `CREATE TABLE IF NOT EXISTS after_sales_reserve (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_short_name varchar(200) NOT NULL,
    rate numeric NOT NULL DEFAULT 0,
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  `CREATE TABLE IF NOT EXISTS excess_marketing_expense (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_short_name varchar(200) NOT NULL,
    rate numeric NOT NULL DEFAULT 0,
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  `CREATE TABLE IF NOT EXISTS tax_rate (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rate numeric NOT NULL DEFAULT 0.13,
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  `CREATE TABLE IF NOT EXISTS custom_fee_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(200) NOT NULL,
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  `CREATE TABLE IF NOT EXISTS gross_margin_target_old (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_short_name varchar(200) NOT NULL,
    model varchar(100) NOT NULL,
    target_margin numeric NOT NULL DEFAULT 0.30,
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  `CREATE TABLE IF NOT EXISTS channel_type (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(100) NOT NULL,
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  `CREATE TABLE IF NOT EXISTS alert_threshold (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    high_percent numeric NOT NULL DEFAULT 0.80,
    mid_percent numeric NOT NULL DEFAULT 0.10,
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  `CREATE TABLE IF NOT EXISTS user_account (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id user_profile NOT NULL,
    username varchar(100) NOT NULL,
    password_hash varchar(255) NOT NULL,
    display_name varchar(100) NOT NULL,
    region varchar(50) NOT NULL,
    email varchar(255) NOT NULL,
    phone varchar(50) NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    roles text[] NOT NULL DEFAULT '{}',
    _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _created_by user_profile,
    _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_by user_profile
  )`,

  // ---- 唯一索引 ----
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_short_name ON customer (short_name)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_code_unique ON customer (customer_code)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_category_unique ON customer_category_grade (customer_id, category)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS product_category_name_key ON product_category (name)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS pricing_formula_config_config_key_key ON pricing_formula_config (config_key)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_mep_customer ON marketing_expense_pool (customer_short_name)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_after_sales_pool_customer ON after_sales_pool (customer_short_name)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_quotation_no ON quotation (quotation_no)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_product_model_color ON product (model, color)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_product_code_unique ON product (code)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_product_grade_margin_category_level ON product_grade_margin (category, customer_level_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_price_sensitivity_region_mode ON price_sensitivity (region, mode)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_level_name ON customer_level (name)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_insurance_credit ON insurance_coefficient (credit_condition)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_after_sales_customer ON after_sales_reserve (customer_short_name)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_excess_marketing_customer ON excess_marketing_expense (customer_short_name)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_fee_config_name ON custom_fee_config (name)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_margin_old_customer_model ON gross_margin_target_old (customer_short_name, model)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_channel_type_name ON channel_type (name)`,

  // ---- 普通索引 ----
  `CREATE INDEX IF NOT EXISTS idx_mepr_pool_id ON marketing_expense_pool_record (pool_id)`,
  `CREATE INDEX IF NOT EXISTS idx_mepr_quotation_id ON marketing_expense_pool_record (quotation_id)`,
  `CREATE INDEX IF NOT EXISTS idx_aspr_pool_id ON after_sales_pool_record (pool_id)`,
  `CREATE INDEX IF NOT EXISTS idx_aspr_quotation_id ON after_sales_pool_record (quotation_id)`,
  `CREATE INDEX IF NOT EXISTS idx_quotation_status ON quotation (status)`,
  `CREATE INDEX IF NOT EXISTS idx_quotation_item_quotation_id ON quotation_item (quotation_id)`,
  `CREATE INDEX IF NOT EXISTS idx_quotation_custom_fee_quotation_id ON quotation_custom_fee (quotation_id)`,
  `CREATE INDEX IF NOT EXISTS idx_file_record_folder_path ON file_record (folder_path)`,
  `CREATE INDEX IF NOT EXISTS idx_file_record_upload_status ON file_record (upload_status)`,
];
