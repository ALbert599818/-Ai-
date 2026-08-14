import { useState, useEffect, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@client/src/components/ui/card';
import { toast } from 'sonner';
import { getQuotationDetail } from '@client/src/api/quotation';
import { getProductCategories } from '@client/src/api/product-category';
import type { ProductCategoryItem } from '@shared/product-category';
import QuotationDetailActions from './QuotationDetailActions';
import type {
  QuotationDetailResponse,
  CalculatedQuotationItem,
} from '@shared/quotation';
import { PRODUCT_CATEGORIES } from '@shared/customer';

function getStatusBadge(
  status: string,
): { className: string; label: string } {
  switch (status) {
    case 'draft':
      return {
        className: 'bg-gray-100 text-gray-600 rounded-sm',
        label: '草稿',
      };
    case 'submitted':
      return {
        className: 'bg-blue-100 text-blue-700 rounded-sm',
        label: '已提交',
      };
    case 'approved':
      return {
        className: 'bg-green-100 text-green-700 rounded-sm',
        label: '已审批',
      };
    case 'rejected':
      return {
        className: 'bg-red-100 text-red-700 rounded-sm',
        label: '已驳回',
      };
    default:
      return {
        className: 'bg-gray-100 text-gray-600 rounded-sm',
        label: status,
      };
  }
}

function getAlertBadge(
  level: 'none' | 'yellow' | 'red',
): { className: string; label: string } | null {
  switch (level) {
    case 'yellow':
      return {
        className: 'bg-yellow-100 text-yellow-800 rounded-sm',
        label: '预警',
      };
    case 'red':
      return {
        className: 'bg-red-100 text-red-700 rounded-sm',
        label: '告警',
      };
    default:
      return null;
  }
}

function formatAmount(value: number): string {
  return `¥${value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function getMarginColor(margin: number): string {
  const pct = margin * 100;
  if (pct >= 30) return 'text-green-600';
  if (pct >= 20) return 'text-yellow-600';
  return 'text-red-600';
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

const COEFFICIENT_FIELDS: {
  key: keyof QuotationDetailResponse;
  label: string;
  isPercent?: boolean;
}[] = [
  { key: 'gradeCoefficient', label: '客户等级系数' },
  { key: 'sensitivityCoefficient', label: '价格敏感度系数' },
  { key: 'creditCoefficient', label: '信用条件系数' },
  { key: 'insuranceCoefficient', label: '信保系数' },
  { key: 'logisticsCoefficient', label: '物流系数' },
  { key: 'exchangeRiskRate', label: '汇率风险率', isPercent: true },
  { key: 'afterSalesRate', label: '售后准备金率', isPercent: true },
  {
    key: 'marketingExpenseRate',
    label: '超额营销费率',
    isPercent: true,
  },
  { key: 'quantityCoefficient', label: '数量系数' },
  { key: 'taxRate', label: '税率', isPercent: true },
];

export default function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] =
    useState<QuotationDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [categoryList, setCategoryList] = useState<ProductCategoryItem[]>([]);

  const loadCategories = () => {
    getProductCategories()
      .then((list: ProductCategoryItem[]) => {
        const sorted = [...list].sort(
          (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
        );
        setCategoryList(sorted);
      })
      .catch(() => {});
  };

  const categoryNames = categoryList.length > 0
    ? categoryList.map((c: ProductCategoryItem) => c.name)
    : PRODUCT_CATEGORIES.slice();

  const loadDetail = () => {
    if (!id) return;
    setLoading(true);
    getQuotationDetail(id)
      .then((data: QuotationDetailResponse) => {
        setDetail(data);
      })
      .catch(() => {
        toast.error('获取报价单详情失败');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDetail();
    loadCategories();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        加载中...
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <span className="text-muted-foreground text-sm">
          报价单不存在或已被删除
        </span>
        <Button variant="outline" onClick={() => navigate('/quotations')}>
          返回列表
        </Button>
      </div>
    );
  }

  const statusBadge = getStatusBadge(detail.status);

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/quotations')}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground font-mono tabular-nums">
            {detail.quotationNo}
          </h1>
          <span
            className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${statusBadge.className}`}
          >
            {statusBadge.label}
          </span>
        </div>
        <QuotationDetailActions detail={detail} onStatusChange={loadDetail} />
      </div>

      {/* Reject reason banner */}
      {detail.status === 'rejected' && detail.rejectReason && (
        <div className="mx-6 mt-4 rounded-sm border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 shrink-0">
          <span className="font-medium">驳回原因：</span>
          {detail.rejectReason}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {/* Customer Info Card */}
        <Card className="rounded-sm shadow-none border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              客户信息
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-8 gap-y-3">
              <InfoField label="客户简称" value={detail.customerShortName} />
              <InfoField label="客户全称" value={detail.customerFullName} />
              <InfoField label="国家" value={detail.country} />
              <InfoField label="区域" value={detail.region} />
              <InfoField label="渠道类型" value={detail.channelType} />
              <InfoField
                label="是否新客户"
                value={detail.isNewCustomer ? '是' : '否'}
              />
              <InfoField
                label="弹性储备"
                value={
                  detail.flexibleIsRate
                    ? formatPercent(detail.flexibleReserve)
                    : formatAmount(detail.flexibleReserve)
                }
                mono
              />
            </div>
            {/* Category Grades */}
            {detail.categoryGrades && Object.keys(detail.categoryGrades).length > 0 && (
              <div className="mt-4 pt-3 border-t border-border/50">
                <div className="text-xs text-muted-foreground mb-2">品类等级</div>
                <div className="grid grid-cols-3 gap-2">
                  {categoryNames.map((cat: string) => {
                    const grade = detail.categoryGrades?.[cat] || '无';
                    const badgeStyle = grade === 'S'
                      ? { bg: 'hsl(40, 85%, 55%)', text: '#fff' }
                      : grade === 'A'
                        ? { bg: 'hsl(210, 70%, 55%)', text: '#fff' }
                        : grade === 'B'
                          ? { bg: 'hsl(220, 10%, 60%)', text: '#fff' }
                          : null;
                    return (
                      <div key={cat} className="flex items-center justify-between px-3 py-1.5 border border-border rounded-sm bg-background">
                        <span className="text-xs text-foreground">{cat}</span>
                        {badgeStyle ? (
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-sm"
                            style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.text }}
                          >
                            {grade}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">{grade}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coefficient Snapshot Card */}
        <Card className="rounded-sm shadow-none border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              系数快照
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-10 gap-y-4">
              {COEFFICIENT_FIELDS.map(
                (field: {
                  key: keyof QuotationDetailResponse;
                  label: string;
                  isPercent?: boolean;
                }) => {
                  const rawVal = detail[field.key];
                  const numVal =
                    typeof rawVal === 'number' ? rawVal : 0;
                  return (
                    <div key={field.key}>
                      <div className="text-xs text-muted-foreground mb-0.5">
                        {field.label}
                      </div>
                      <div className="text-sm font-medium font-mono tabular-nums text-foreground">
                        {field.isPercent
                          ? formatPercent(numVal)
                          : numVal.toFixed(4)}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quotation Items Table */}
        <Card className="rounded-sm shadow-none border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              报价行项目
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-2">
            {detail.items.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">
                暂无行项目
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border border-border">
                      <th className="border border-border bg-muted px-3 py-3 text-left text-xs font-semibold text-muted-foreground">
                        型号
                      </th>
                      <th className="border border-border bg-muted px-3 py-3 text-left text-xs font-semibold text-muted-foreground">
                        颜色
                      </th>
                      <th className="border border-border bg-muted px-3 py-3 text-left text-xs font-semibold text-muted-foreground">
                        品类
                      </th>
                      <th className="border border-border bg-muted px-3 py-3 text-left text-xs font-semibold text-muted-foreground">
                        产品级别
                      </th>
                      <th className="border border-border bg-muted px-3 py-3 text-right text-xs font-semibold text-muted-foreground">
                        采购成本
                      </th>
                      <th className="border border-border bg-muted px-3 py-3 text-right text-xs font-semibold text-muted-foreground">
                        研发费用
                      </th>
                      <th className="border border-border bg-muted px-3 py-3 text-right text-xs font-semibold text-muted-foreground">
                        MOQ
                      </th>
                      <th className="border border-border bg-muted px-3 py-3 text-right text-xs font-semibold text-muted-foreground">
                        数量
                      </th>
                      <th className="border border-border bg-muted px-3 py-3 text-right text-xs font-semibold text-muted-foreground">
                        目标毛利率
                      </th>
                      <th className="border border-border bg-muted px-3 py-3 text-right text-xs font-semibold text-muted-foreground">
                        单价
                      </th>
                      <th className="border border-border bg-muted px-3 py-3 text-right text-xs font-semibold text-muted-foreground">
                        总价
                      </th>
                      <th className="border border-border bg-muted px-3 py-3 text-right text-xs font-semibold text-muted-foreground">
                        实际毛利率
                      </th>
                      <th className="border border-border bg-muted px-3 py-3 text-right text-xs font-semibold text-muted-foreground">
                        物流系数
                      </th>
                      <th className="border border-border bg-muted px-3 py-3 text-right text-xs font-semibold text-muted-foreground">
                        灵活准备金
                      </th>
                      <th className="border border-border bg-muted px-3 py-3 text-right text-xs font-semibold text-muted-foreground">
                        定制费用
                      </th>
                      <th className="border border-border bg-muted px-3 py-3 text-center text-xs font-semibold text-muted-foreground">
                        告警
                      </th>
                      <th className="border border-border bg-muted w-10 px-3 py-3 text-center text-xs font-semibold text-muted-foreground" />
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items.map(
                      (item: CalculatedQuotationItem, idx: number) => {
                        const alertBadge = getAlertBadge(
                          item.alertLevel,
                        );
                        return (
                          <>
                            <Fragment key={`${item.model}-${item.color}-${idx}`}>
                            <tr
                              className="border-x border-b border-border hover:bg-accent/30 transition-colors"
                            >
                              <td className="px-3 py-3 text-foreground">
                                {item.model}
                              </td>
                              <td className="px-3 py-3 text-foreground">
                                {item.color}
                              </td>
                              <td className="px-3 py-3 text-muted-foreground text-xs">
                                {item.category}
                              </td>
                              <td className="px-3 py-3 text-muted-foreground text-xs">
                                {item.productGrade}
                              </td>
                              <td className="px-3 py-3 text-right font-mono tabular-nums text-foreground">
                                {formatAmount(item.purchaseCost)}
                              </td>
                              <td className="px-3 py-3 text-right font-mono tabular-nums text-foreground">
                                {formatAmount(item.rdCost)}
                              </td>
                              <td className="px-3 py-3 text-right font-mono tabular-nums text-foreground">
                                {item.moq}
                              </td>
                              <td className="px-3 py-3 text-right font-mono tabular-nums text-foreground">
                                {item.quantity}
                              </td>
                              <td className="px-3 py-3 text-right font-mono tabular-nums text-foreground">
                                {formatPercent(item.targetMargin)}
                              </td>
                              <td className="px-3 py-3 text-right font-mono tabular-nums font-medium text-foreground">
                                {formatAmount(item.unitPrice)}
                              </td>
                              <td className="px-3 py-3 text-right font-mono tabular-nums font-medium text-foreground">
                                {formatAmount(item.totalPrice)}
                              </td>
                              <td className="px-3 py-3 text-right font-mono tabular-nums font-medium">
                                <span className={getMarginColor(item.actualMargin)}>
                                  {formatPercent(item.actualMargin)}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-right font-mono tabular-nums text-muted-foreground text-xs">
                                {item.logisticsCoefficient != null
                                  ? item.logisticsCoefficient.toFixed(4)
                                  : '—'}
                              </td>
                              <td className="px-3 py-3 text-right font-mono tabular-nums text-muted-foreground text-xs">
                                {item.flexibleReserveAmount != null && item.flexibleReserveAmount > 0
                                  ? formatAmount(item.flexibleReserveAmount)
                                  : '—'}
                              </td>
                              <td className="px-3 py-3 text-right font-mono tabular-nums text-muted-foreground text-xs">
                                {item.customFeesTotal != null && item.customFeesTotal > 0
                                  ? formatAmount(item.customFeesTotal)
                                  : '—'}
                              </td>
                              <td className="px-3 py-3 text-center">
                                {alertBadge ? (
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${alertBadge.className}`}
                                    title={item.alertMsg}
                                  >
                                    {alertBadge.label}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-xs">
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-center">
                                {item.customFees && item.customFees.length > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setExpandedItems((prev: Set<number>) => {
                                        const next = new Set(prev);
                                        if (next.has(idx)) next.delete(idx);
                                        else next.add(idx);
                                        return next;
                                      });
                                    }}
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    {expandedItems.has(idx) ? (
                                      <ChevronUp className="size-3.5" />
                                    ) : (
                                      <ChevronDown className="size-3.5" />
                                    )}
                                  </button>
                                ) : null}
                              </td>
                            </tr>
                            {expandedItems.has(idx) && item.customFees && item.customFees.length > 0 && (
                              <tr className="border-x border-b border-border bg-accent/20">
                                <td colSpan={17} className="px-6 py-2">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr>
                                        <th className="px-2 py-1 text-left font-medium text-muted-foreground">费用名称</th>
                                        <th className="px-2 py-1 text-right font-medium text-muted-foreground">金额</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {item.customFees.map((fee: { feeName: string; feeAmount: number }, fi: number) => (
                                        <tr key={`${fee.feeName}-${fi}`}>
                                          <td className="px-2 py-1 text-foreground">{fee.feeName}</td>
                                          <td className="px-2 py-1 text-right font-mono tabular-nums text-foreground">{formatAmount(fee.feeAmount)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            )}
                            </Fragment>
                          </>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Custom Fees Table */}
        {detail.customFees.length > 0 && (
          <Card className="rounded-sm shadow-none border-border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">
                定制费用
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border border-border">
                    <th className="border border-border bg-muted px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                      费用名称
                    </th>
                    <th className="border border-border bg-muted px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground w-[200px]">
                      金额
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {detail.customFees.map(
                    (
                      fee: { feeName: string; feeAmount: number },
                      idx: number,
                    ) => (
                      <tr
                        key={`${fee.feeName}-${idx}`}
                        className="border-x border-b border-border hover:bg-accent/30 transition-colors"
                      >
                        <td className="px-4 py-2.5 text-foreground">
                          {fee.feeName}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums text-foreground">
                          {formatAmount(fee.feeAmount)}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* Summary Card */}
        <Card className="rounded-sm shadow-none border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              汇总
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-3">
              <SummaryField
                label="售后准备金小计"
                value={formatAmount(detail.afterSalesSubtotal)}
              />
              <SummaryField
                label="超额营销费用小计"
                value={formatAmount(detail.marketingSubtotal)}
              />
              <SummaryField
                label="税率"
                value={formatPercent(detail.taxRate)}
              />
              <SummaryField
                label="总金额"
                value={formatAmount(detail.totalAmount)}
                highlight
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div
        className={`text-sm text-foreground ${
          mono ? 'font-mono tabular-nums' : ''
        }`}
      >
        {value || '—'}
      </div>
    </div>
  );
}

function SummaryField({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div
        className={`text-sm font-mono tabular-nums ${
          highlight
            ? 'text-2xl font-bold text-primary'
            : 'text-foreground'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
