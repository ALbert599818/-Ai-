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
