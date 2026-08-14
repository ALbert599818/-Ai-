import { Link, NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Globe2,
  FileText,
  Package2,
  Percent,
  Package,
  BarChart3,
  LogOut,
  Zap,
  Receipt,
  Building2,
  Calculator,
  AlertTriangle,
  Settings2,
  TrendingUp,
  UserCog,
  ShieldCheck,
  User,
  FileCheck,
  Database,
  Tag,
  Truck,
  Shield,
  Coins,
  type LucideIcon,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem } from '@/components/ui/breadcrumb';
import { useAppAuth } from '@client/src/contexts/AuthContext';
import { MENU_PERMISSIONS } from '@shared/role';
import { Image } from '@client/src/components/ui/image';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: '',
    items: [
      { path: '/', label: '工作台', icon: LayoutDashboard },
      { path: '/quotation-engine', label: '报价引擎', icon: Zap },
      { path: '/quotations', label: '报价单列表', icon: Receipt },
    ],
  },
  {
    label: '基础数据管理',
    items: [
      { path: '/product', label: '物料基础数据管理', icon: Database },
      { path: '/customers', label: '客户管理', icon: Building2 },
      { path: '/channel-types', label: '渠道类型', icon: Users },
    ],
  },
  {
    label: '产品折扣系数管理',
    items: [
      { path: '/customer-level', label: '品类等级管理', icon: Tag },
      { path: '/price-sensitivity', label: '客户价格敏感系数录入', icon: Globe2 },
      { path: '/credit-terms', label: '客户信用条件系数录入', icon: FileText },
      { path: '/purchase-quantity', label: '拿货量系数录入', icon: Package2 },
      { path: '/logistics-cost', label: '物流成本系数录入', icon: Truck },
      { path: '/insurance-coefficients', label: '保费系数录入', icon: Shield },
      { path: '/exchange-risk-rate', label: '固定汇率风险准备金率录入', icon: TrendingUp },
      { path: '/after-sales-reserve', label: '售后准备金率录入', icon: Coins },
    ],
  },
  {
    label: '产品毛利率目标管理',
    items: [
      { path: '/margin-old', label: '老品毛利率目标', icon: TrendingUp },
      { path: '/product-grade-margin', label: '新品毛利率目标', icon: BarChart3 },
    ],
  },
  {
    label: '税率管理',
    items: [
      { path: '/tax-rate', label: '税率录入', icon: Calculator },
    ],
  },
  {
    label: '客户定制项维护',
    items: [
      { path: '/custom-fees', label: '定制项配置', icon: Settings2 },
    ],
  },
  {
    label: '系统管理',
    items: [
      { path: '/other-discounts', label: '其它折扣', icon: Percent },
      { path: '/excess-marketing', label: '超额营销费用率', icon: BarChart3 },
      { path: '/alert-threshold', label: '告警阈值', icon: AlertTriangle },
      { path: '/user-management', label: '用户管理', icon: UserCog },
      { path: '/pricing-formula-config', label: '报价公式配置', icon: Calculator },
    ],
  },
];

const GUEST_AVATAR = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/LMfspH/ljhwZthlaukjlkulzlp/miao/no-person.svg';

const LayoutContent = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAppAuth();
  const userRoles = user?.roles ?? [];

  const filteredGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      const perm = MENU_PERMISSIONS.find(p => p.path === item.path);
      if (!perm) return false;
      return perm.viewRoles.some(role => userRoles.includes(role));
    }),
  })).filter((group) => group.items.length > 0);

  const allItems = filteredGroups.flatMap((g) => g.items);
  const centerPermitted = MENU_PERMISSIONS
    .find((p) => p.path === '/my-center')
    ?.viewRoles.some((role) => userRoles.includes(role));
  const activeItem = allItems
    .filter((item) => {
      if (item.path === '/') return pathname === '/';
      return pathname.startsWith(item.path);
    })
    .sort((a, b) => b.path.length - a.path.length)[0];

  const handleLogout = () => {
    logout();
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const isLoggedIn = !!user;

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="/">
                  <div className="flex size-8 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                    <LayoutDashboard className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold">
                      品牌报价系统
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      配置管理
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {filteredGroups.map((group) => (
            <SidebarGroup key={group.label || '__top'}>
              {group.label && (
                <SidebarGroupLabel className="px-3 py-2 text-sm font-bold text-foreground">
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        asChild
                        isActive={activeItem?.path === item.path}
                        tooltip={item.label}
                      >
                        <Link to={item.path}>
                          <item.icon className="size-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    tooltip={isLoggedIn ? user.displayName : '游客'}
                  >
                    <Image
                      src={isLoggedIn ? (user.avatar || GUEST_AVATAR) : GUEST_AVATAR}
                      alt={isLoggedIn ? user.displayName : '游客'}
                      className="size-8 shrink-0 rounded-full object-cover"
                    />
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                      <span className="truncate font-medium">
                        {isLoggedIn ? user.displayName : '游客'}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 rounded-sm"
                  side="bottom"
                  align="end"
                  sideOffset={4}
                >
                  {isLoggedIn ? (
                    <>
                      {centerPermitted && (
                        <DropdownMenuItem
                          onClick={() => navigate('/my-center')}
                        >
                          <User className="mr-2 size-4" />
                          个人中心
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 size-4" />
                        退出登录
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem onClick={handleLogin}>
                      登录
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger className="-ml-1" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="text-foreground font-medium">
                {activeItem?.label || '首页'}
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </>
  );
};

const Layout = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default Layout;
