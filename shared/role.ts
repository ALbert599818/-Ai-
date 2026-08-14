export interface MenuPermission {
  path: string;
  label: string;
  viewRoles: string[];
}

export const ALL_ROLES = ['quotation_editor', 'admin', 'super_admin'] as const;

export const ROLE_LABEL: Record<string, string> = {
  super_admin: '超级管理员',
  admin: '报价管理员',
  quotation_editor: '报价申报员',
};

export const TEST_ACCOUNT_ROLES = ['quotation_editor'] as const;

export const MENU_PERMISSIONS: MenuPermission[] = [
  { path: '/', label: '工作台', viewRoles: ['quotation_editor', 'admin', 'super_admin'] },
  { path: '/quotation-engine', label: '报价引擎', viewRoles: ['quotation_editor', 'admin', 'super_admin'] },
  { path: '/quotations', label: '报价单列表', viewRoles: ['quotation_editor', 'admin', 'super_admin'] },
  { path: '/product', label: '物料基础数据管理', viewRoles: ['admin', 'super_admin'] },
  { path: '/customers', label: '客户管理', viewRoles: ['admin', 'super_admin'] },
  { path: '/channel-types', label: '渠道类型', viewRoles: ['admin', 'super_admin'] },
  { path: '/customer-level', label: '品类等级管理', viewRoles: ['admin', 'super_admin'] },
  { path: '/price-sensitivity', label: '客户价格敏感系数录入', viewRoles: ['admin', 'super_admin'] },
  { path: '/credit-terms', label: '客户信用条件系数录入', viewRoles: ['admin', 'super_admin'] },
  { path: '/purchase-quantity', label: '拿货量系数录入', viewRoles: ['admin', 'super_admin'] },
  { path: '/logistics-cost', label: '物流成本系数录入', viewRoles: ['admin', 'super_admin'] },
  { path: '/insurance-coefficients', label: '保费系数录入', viewRoles: ['admin', 'super_admin'] },
  { path: '/exchange-risk-rate', label: '固定汇率风险准备金率录入', viewRoles: ['admin', 'super_admin'] },
  { path: '/after-sales-reserve', label: '售后准备金率录入', viewRoles: ['admin', 'super_admin'] },
  { path: '/margin-old', label: '老品毛利率目标', viewRoles: ['admin', 'super_admin'] },
  { path: '/product-grade-margin', label: '新品毛利率目标', viewRoles: ['admin', 'super_admin'] },
  { path: '/tax-rate', label: '税率录入', viewRoles: ['admin', 'super_admin'] },
  { path: '/custom-fees', label: '客户定制项维护', viewRoles: ['admin', 'super_admin'] },
  { path: '/other-discounts', label: '其它折扣', viewRoles: ['admin', 'super_admin'] },
  { path: '/excess-marketing', label: '超额营销费用率', viewRoles: ['admin', 'super_admin'] },
  { path: '/alert-threshold', label: '告警阈值', viewRoles: ['admin', 'super_admin'] },
  { path: '/user-management', label: '用户管理', viewRoles: ['super_admin'] },
  { path: '/pricing-formula-config', label: '报价公式配置', viewRoles: ['super_admin'] },
  { path: '/my-center', label: '个人中心', viewRoles: ['quotation_editor', 'admin', 'super_admin'] },
];

export const EDIT_ROLES = ['quotation_editor', 'admin', 'super_admin'];
export const ADMIN_ROLES = ['admin', 'super_admin'];
