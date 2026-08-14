import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Settings2,
  Eye,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  customerApi,
  productApi,
  quotationApi,
  dataImportApi,
} from '@client/src/api';
import { useAppAuth } from '@client/src/contexts/AuthContext';
import type { QuotationListItem } from '@shared/quotation';

const ADMIN_ROLES = ['admin', 'super_admin'];
const EDITOR_ROLES = ['quotation_editor', 'admin', 'super_admin'];

interface StatCard {
  label: string;
  value: number;
  color: string;
}

const STATUS_MAP: Record<string, { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { text: '草稿', variant: 'outline' },
  submitted: { text: '已提交', variant: 'default' },
  approved: { text: '已审批', variant: 'secondary' },
  rejected: { text: '已驳回', variant: 'destructive' },
};

function getStatusBadge(status: string): { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  return STATUS_MAP[status] ?? { text: status, variant: 'outline' };
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}`;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { hasAnyRole } = useAppAuth();
  const isAdmin = hasAnyRole(ADMIN_ROLES);
  const isEditor = hasAnyRole(EDITOR_ROLES);
  const [stats, setStats] = useState<StatCard[]>([]);
  const [quotations, setQuotations] = useState<QuotationListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const promises: Promise<unknown>[] = [];
        if (isAdmin) {
          promises.push(
            customerApi.getCustomerList({ page: 1, pageSize: 1 }),
            productApi.getProductList({ page: 1, pageSize: 1 }),
          );
        }
        promises.push(quotationApi.getQuotationList({ page: 1, pageSize: 10 }));
        const results = await Promise.all(promises);

        const quotationRes = results[results.length - 1] as {
          total: number;
          items: QuotationListItem[];
        };
        const totalQuotations = quotationRes.total;
        const draftCount = quotationRes.items.filter(
          (item: QuotationListItem) => item.status === 'draft',
        ).length;

        const newStats: StatCard[] = [];
        if (isAdmin) {
          const customerRes = results[0] as { total: number };
          const productRes = results[1] as { total: number };
          newStats.push(
            { label: '客户总数', value: customerRes.total, color: 'bg-primary' },
            { label: '产品总数', value: productRes.total, color: 'bg-[hsl(150_60%_38%)]' },
          );
        }
        newStats.push(
          { label: '报价单总数', value: totalQuotations, color: 'bg-[hsl(210_70%_55%)]' },
          { label: '草稿数量', value: draftCount, color: 'bg-[hsl(38_90%_45%)]' },
        );

        setStats(newStats);
        setQuotations(quotationRes.items);
      } catch {
        // data load failed, keep defaults
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAdmin]);

  const [seeding, setSeeding] = useState(false);
  const handleSeed = async () => {
    if (seeding) return;
    setSeeding(true);
    try {
      const result = await dataImportApi.seedDemoData();
      const seeded = result.seededTables?.length ?? 0;
      if (seeded > 0) {
        toast.success(
          `已初始化 ${seeded} 张配置表的示例数据`,
        );
        setTimeout(() => window.location.reload(), 800);
      } else {
        toast.info('所有配置表已有数据，无需初始化');
      }
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : '初始化失败';
      toast.error(`初始化示例数据失败: ${msg}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">工作台</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            欢迎使用 AI 智能报价系统，快速创建和管理销售报价单
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              disabled={seeding}
              onClick={handleSeed}
            >
              <Sparkles className="mr-1.5 size-4" />
              {seeding ? '初始化中...' : '初始化示例数据'}
            </Button>
          )}
          {isEditor && (
            <Button onClick={() => navigate('/quotation-engine')}>
              <Plus className="mr-1.5 size-4" />
              新建报价单
            </Button>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className={`mb-6 grid gap-4 ${isAdmin ? 'grid-cols-4' : 'grid-cols-2'}`}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="relative overflow-hidden border border-border bg-card px-5 py-4 rounded-sm"
          >
            <div
              className={`absolute left-0 top-0 h-1 w-full ${stat.color}`}
              style={{ height: '4px' }}
            />
            <div className="text-2xl font-bold tabular-nums text-foreground">
              {loading ? '—' : stat.value.toLocaleString()}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Quotations Table */}
      <div className="mb-6 rounded-sm border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">最近报价单</h2>
          <Link to="/quotations" className="text-xs text-primary hover:underline">
            查看全部
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-[hsl(220_15%_97%)]">
                <th className="border-r border-border px-4 py-2.5 text-left font-medium text-muted-foreground">
                  报价单号
                </th>
                <th className="border-r border-border px-4 py-2.5 text-left font-medium text-muted-foreground">
                  客户
                </th>
                <th className="border-r border-border px-4 py-2.5 text-left font-medium text-muted-foreground">
                  国家
                </th>
                <th className="border-r border-border px-4 py-2.5 text-right font-medium text-muted-foreground">
                  整单金额
                </th>
                <th className="border-r border-border px-4 py-2.5 text-center font-medium text-muted-foreground">
                  状态
                </th>
                <th className="border-r border-border px-4 py-2.5 text-left font-medium text-muted-foreground">
                  时间
                </th>
                <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    加载中...
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    暂无报价单数据
                  </td>
                </tr>
              ) : (
                quotations.map((q) => {
                  const badge = getStatusBadge(q.status);
                  return (
                    <tr
                      key={q.id}
                      className="border-b border-border last:border-b-0 hover:bg-accent/40 transition-colors"
                    >
                      <td className="border-r border-border px-4 py-2.5 font-mono text-xs text-foreground">
                        {q.quotationNo}
                      </td>
                      <td className="border-r border-border px-4 py-2.5 text-foreground">
                        {q.customerShortName}
                      </td>
                      <td className="border-r border-border px-4 py-2.5 text-muted-foreground">
                        —
                      </td>
                      <td className="border-r border-border px-4 py-2.5 text-right font-mono tabular-nums text-foreground">
                        ¥{formatAmount(q.totalAmount)}
                      </td>
                      <td className="border-r border-border px-4 py-2.5 text-center">
                        <Badge variant={badge.variant}>{badge.text}</Badge>
                      </td>
                      <td className="border-r border-border px-4 py-2.5 text-xs text-muted-foreground">
                        {formatDate(q.createdAt)}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/quotations/${q.id}`)}
                          >
                            <Eye className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      {(isEditor || isAdmin) && (
        <>
          <h2 className="mb-3 text-sm font-semibold text-foreground">快捷入口</h2>
          <div className="grid grid-cols-2 gap-4">
            {isEditor && (
              <button
                type="button"
                onClick={() => navigate('/quotation-engine')}
                className="group flex items-center gap-4 border border-border bg-card px-5 py-4 rounded-sm text-left transition-colors hover:border-primary"
              >
                <div className="flex size-10 items-center justify-center rounded-sm bg-primary/10 text-primary">
                  <Plus className="size-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">新建报价单</div>
                  <div className="text-xs text-muted-foreground">快速创建新的销售报价</div>
                </div>
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => navigate('/customer-level')}
                className="group flex items-center gap-4 border border-border bg-card px-5 py-4 rounded-sm text-left transition-colors hover:border-primary"
              >
                <div className="flex size-10 items-center justify-center rounded-sm bg-[hsl(210_70%_55%)]/10 text-[hsl(210_70%_55%)]">
                  <Settings2 className="size-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">系数配置</div>
                  <div className="text-xs text-muted-foreground">管理折扣系数和定价规则</div>
                </div>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
