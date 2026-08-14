export interface UserAccountInfo {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  account: string;
  region: string;
  email: string;
  phone: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 用户账号详情（含密码哈希等敏感字段） */
export interface UserAccountDetail extends UserAccountInfo {
  passwordHash: string;
}

/** 用户列表分页响应 */
export interface UserAccountListResponse {
  items: UserAccountDetail[];
  total: number;
  page: number;
  pageSize: number;
}

/** 管理员更新用户请求 */
export interface AdminUpdateUserRequest {
  displayName?: string;
  account?: string;
  email?: string;
  phone?: string;
  region?: string;
  passwordHash?: string;
  roles?: string[];
  isActive?: boolean;
}

/** 用户列表查询参数 */
export interface UserAccountListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  region?: string;
}

export interface UpdateMyAccountRequest {
  displayName?: string;
  email?: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

/** 确保账号存在请求 */
export interface EnsureAccountRequest {
  userId: string;
  displayName?: string;
  email?: string;
}

/** 创建测试账号请求 */
export interface CreateTestAccountRequest {
  username: string;
  displayName: string;
  password: string;
  region?: string;
  role?: string;
}
