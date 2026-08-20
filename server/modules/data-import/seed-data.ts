export const SEED_CATEGORIES = [
  '音频-耳机',
  '音频-音箱（含其他）',
  'PC-游戏耳机',
  'PC-非耳机',
  '移动',
  '投影仪',
  '手表',
  '小家电',
];

export const SEED_CUSTOMER_LEVELS: Array<{ name: string; discount: string }> = [
  { name: 'S级', discount: '0.92' },
  { name: 'A级', discount: '0.95' },
  { name: 'B级', discount: '0.98' },
  { name: '无', discount: '1' },
];

export const SEED_CHANNEL_TYPES = ['B2B', 'B2C', '线下', '电商平台'];

export const SEED_PRICE_SENSITIVITY: Array<{
  region: string;
  mode: string;
  channelType: string;
  discount: string;
}> = [
  { region: '欧美', mode: 'B2B', channelType: 'B2B', discount: '0.97' },
  { region: '欧美', mode: 'B2C', channelType: 'B2C', discount: '1.00' },
  { region: '东南亚', mode: 'B2B', channelType: 'B2B', discount: '0.98' },
  { region: '东南亚', mode: 'B2C', channelType: 'B2C', discount: '1.01' },
  { region: '拉美', mode: 'B2B', channelType: 'B2B', discount: '0.99' },
  { region: '拉美', mode: 'B2C', channelType: 'B2C', discount: '1.02' },
  { region: '非洲', mode: 'B2B', channelType: 'B2B', discount: '0.98' },
  { region: '非洲', mode: 'B2C', channelType: 'B2C', discount: '1.00' },
];

export const SEED_CREDIT_TERMS: Array<{
  category: string;
  subItem: string;
  discount: string;
}> = [
  { category: '预付', subItem: '发货前付清全款', discount: '0.98' },
  { category: '月结30天', subItem: '发票后30天付款', discount: '1.00' },
  { category: '月结60天', subItem: '发票后60天付款', discount: '1.01' },
  { category: '月结90天', subItem: '发票后90天付款', discount: '1.02' },
  { category: '货到付款', subItem: '到港后付清', discount: '1.03' },
];

export const SEED_PURCHASE_QUANTITIES: Array<{
  typeDesc: string;
  minMultiple: string;
  maxMultiple: string;
  discount: string;
}> = [
  { typeDesc: '小于MOQ', minMultiple: '0', maxMultiple: '1', discount: '1.05' },
  {
    typeDesc: 'MOQ ~ 1.5倍MOQ',
    minMultiple: '1',
    maxMultiple: '1.5',
    discount: '1.00',
  },
  {
    typeDesc: '1.5倍MOQ ~ 3倍MOQ',
    minMultiple: '1.5',
    maxMultiple: '3',
    discount: '0.98',
  },
  {
    typeDesc: '大于3倍MOQ',
    minMultiple: '3',
    maxMultiple: '999999',
    discount: '0.95',
  },
];

export const SEED_LOGISTICS_COSTS: Array<{ costType: string; discount: string }> = [
  { costType: '散货拼箱', discount: '1.02' },
  { costType: '20尺整柜', discount: '0.98' },
  { costType: '40尺整柜', discount: '0.96' },
];

export const SEED_OTHER_DISCOUNTS: Array<{
  discountType: string;
  discount: string;
}> = [
  { discountType: '常规其他折扣', discount: '1' },
];

export const SEED_INSURANCE_COEFFICIENTS: Array<{
  creditCondition: string;
  coefficient: string;
}> = [
  { creditCondition: '预付', coefficient: '0.005' },
  { creditCondition: '月结30天', coefficient: '0.010' },
  { creditCondition: '月结60天', coefficient: '0.015' },
  { creditCondition: '月结90天', coefficient: '0.020' },
  { creditCondition: '货到付款', coefficient: '0.020' },
];

export const SEED_CUSTOM_FEE_CONFIGS = [
  '国家认证费',
  '返工费',
  '验货费',
  '开模费',
  '额外零配件',
  '外箱规格调整',
  '改说明书',
];

export const SEED_CUSTOMERS: Array<{
  shortName: string;
  fullName: string;
  country: string;
  region: string;
  channelType: string;
  creditCondition: string;
  grade: string;
  customerCode: string;
  paymentTerm: string;
  continent: string;
  salesChannel: string;
}> = [
  {
    shortName: '美国BEST',
    fullName: 'BestBuy Electronics LLC',
    country: '美国',
    region: '欧美',
    channelType: 'B2C',
    creditCondition: '月结30天',
    grade: 'S级',
    customerCode: 'CUST-001',
    paymentTerm: '月结30天',
    continent: '北美',
    salesChannel: 'B2C',
  },
  {
    shortName: '加拿大ADN',
    fullName: 'ADN Technology Canada Inc.',
    country: '加拿大',
    region: '欧美',
    channelType: 'B2B',
    creditCondition: '月结30天',
    grade: 'A级',
    customerCode: 'CUST-002',
    paymentTerm: '月结30天',
    continent: '北美',
    salesChannel: 'B2B',
  },
  {
    shortName: '英国UKLA',
    fullName: 'UKLA Distribution Ltd.',
    country: '英国',
    region: '欧美',
    channelType: '线下',
    creditCondition: '月结60天',
    grade: 'A级',
    customerCode: 'CUST-003',
    paymentTerm: '月结60天',
    continent: '欧洲',
    salesChannel: '线下',
  },
  {
    shortName: '德国DEKA',
    fullName: 'DEKA GmbH',
    country: '德国',
    region: '欧美',
    channelType: 'B2B',
    creditCondition: '预付',
    grade: 'B级',
    customerCode: 'CUST-004',
    paymentTerm: '预付',
    continent: '欧洲',
    salesChannel: 'B2B',
  },
  {
    shortName: '新加坡SGE',
    fullName: 'SG Electronics Pte. Ltd.',
    country: '新加坡',
    region: '东南亚',
    channelType: '电商平台',
    creditCondition: '月结30天',
    grade: 'A级',
    customerCode: 'CUST-005',
    paymentTerm: '月结30天',
    continent: '亚洲',
    salesChannel: '电商平台',
  },
  {
    shortName: '印尼IDNA',
    fullName: 'PT Indonesia Nusantara',
    country: '印尼',
    region: '东南亚',
    channelType: 'B2B',
    creditCondition: '货到付款',
    grade: 'B级',
    customerCode: 'CUST-006',
    paymentTerm: '货到付款',
    continent: '亚洲',
    salesChannel: 'B2B',
  },
  {
    shortName: '巴西BRAS',
    fullName: 'Brasil Importadora Ltda.',
    country: '巴西',
    region: '拉美',
    channelType: 'B2B',
    creditCondition: '月结90天',
    grade: 'B级',
    customerCode: 'CUST-007',
    paymentTerm: '月结90天',
    continent: '南美',
    salesChannel: 'B2B',
  },
  {
    shortName: '墨西哥MXA',
    fullName: 'Mexicana Comercial S.A.',
    country: '墨西哥',
    region: '拉美',
    channelType: '线下',
    creditCondition: '月结60天',
    grade: '无',
    customerCode: 'CUST-008',
    paymentTerm: '月结60天',
    continent: '北美',
    salesChannel: '线下',
  },
  {
    shortName: '南非SAF',
    fullName: 'South Africa Retail Pty.',
    country: '南非',
    region: '非洲',
    channelType: 'B2B',
    creditCondition: '预付',
    grade: '无',
    customerCode: 'CUST-009',
    paymentTerm: '预付',
    continent: '非洲',
    salesChannel: 'B2B',
  },
  {
    shortName: '尼日利亚NGA',
    fullName: 'Nigeria Trading Co.',
    country: '尼日利亚',
    region: '非洲',
    channelType: 'B2C',
    creditCondition: '货到付款',
    grade: '无',
    customerCode: 'CUST-010',
    paymentTerm: '货到付款',
    continent: '非洲',
    salesChannel: 'B2C',
  },
];

export const SEED_PRODUCTS: Array<{
  model: string;
  color: string;
  purchasePrice: string;
  moq: number;
  category: string;
  productGrade: string;
  code: string;
  series: string;
  erpCategory: string;
  rdCost: string;
  isNewProduct: boolean;
}> = [
  {
    model: 'H2000',
    color: '黑色',
    purchasePrice: '120',
    moq: 500,
    category: '音频-耳机',
    productGrade: 'S',
    code: 'P-001',
    series: 'H系列',
    erpCategory: '音频-耳机',
    rdCost: '15',
    isNewProduct: true,
  },
  {
    model: 'H2000',
    color: '白色',
    purchasePrice: '120',
    moq: 500,
    category: '音频-耳机',
    productGrade: 'S',
    code: 'P-002',
    series: 'H系列',
    erpCategory: '音频-耳机',
    rdCost: '15',
    isNewProduct: true,
  },
  {
    model: 'H3000',
    color: '黑色',
    purchasePrice: '180',
    moq: 400,
    category: '音频-耳机',
    productGrade: 'S',
    code: 'P-003',
    series: 'H系列',
    erpCategory: '音频-耳机',
    rdCost: '22',
    isNewProduct: true,
  },
  {
    model: 'X100',
    color: '黑色',
    purchasePrice: '80',
    moq: 800,
    category: 'PC-游戏耳机',
    productGrade: 'A',
    code: 'P-004',
    series: 'X系列',
    erpCategory: 'PC-游戏耳机',
    rdCost: '10',
    isNewProduct: false,
  },
  {
    model: 'KB-200',
    color: '黑色',
    purchasePrice: '200',
    moq: 600,
    category: 'PC-非耳机',
    productGrade: 'A',
    code: 'P-005',
    series: 'KB系列',
    erpCategory: 'PC-非耳机',
    rdCost: '25',
    isNewProduct: false,
  },
  {
    model: 'M500',
    color: '蓝色',
    purchasePrice: '150',
    moq: 300,
    category: '移动',
    productGrade: 'A',
    code: 'P-006',
    series: 'M系列',
    erpCategory: '移动',
    rdCost: '20',
    isNewProduct: true,
  },
  {
    model: 'SPK-300',
    color: '黑色',
    purchasePrice: '95',
    moq: 400,
    category: '音频-音箱（含其他）',
    productGrade: 'B',
    code: 'P-007',
    series: 'SPK系列',
    erpCategory: '音频-音箱（含其他）',
    rdCost: '12',
    isNewProduct: false,
  },
  {
    model: 'PJ-4K',
    color: '白色',
    purchasePrice: '450',
    moq: 100,
    category: '投影仪',
    productGrade: 'A',
    code: 'P-008',
    series: 'PJ系列',
    erpCategory: '投影仪',
    rdCost: '60',
    isNewProduct: true,
  },
  {
    model: 'WT-8',
    color: '银色',
    purchasePrice: '220',
    moq: 200,
    category: '手表',
    productGrade: 'B',
    code: 'P-009',
    series: 'WT系列',
    erpCategory: '手表',
    rdCost: '30',
    isNewProduct: false,
  },
  {
    model: 'KA-101',
    color: '白色',
    purchasePrice: '60',
    moq: 1000,
    category: '小家电',
    productGrade: 'C',
    code: 'P-010',
    series: 'KA系列',
    erpCategory: '小家电',
    rdCost: '8',
    isNewProduct: false,
  },
];

export const SEED_GROSS_MARGIN_TARGET_MAP: Record<string, Record<string, string>> = {
  'S级': {
    '音频-耳机': '0.35',
    '音频-音箱（含其他）': '0.35',
    'PC-游戏耳机': '0.40',
    'PC-非耳机': '0.38',
    '移动': '0.42',
    '投影仪': '0.30',
    '手表': '0.40',
    '小家电': '0.35',
  },
  'A级': {
    '音频-耳机': '0.32',
    '音频-音箱（含其他）': '0.32',
    'PC-游戏耳机': '0.36',
    'PC-非耳机': '0.34',
    '移动': '0.38',
    '投影仪': '0.28',
    '手表': '0.36',
    '小家电': '0.32',
  },
  'B级': {
    '音频-耳机': '0.28',
    '音频-音箱（含其他）': '0.28',
    'PC-游戏耳机': '0.32',
    'PC-非耳机': '0.30',
    '移动': '0.34',
    '投影仪': '0.25',
    '手表': '0.32',
    '小家电': '0.28',
  },
  '无': {
    '音频-耳机': '0.25',
    '音频-音箱（含其他）': '0.25',
    'PC-游戏耳机': '0.28',
    'PC-非耳机': '0.26',
    '移动': '0.30',
    '投影仪': '0.22',
    '手表': '0.28',
    '小家电': '0.25',
  },
};
