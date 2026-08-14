import { Calculator, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface QuotationItemResult {
  model: string;
  color: string;
  quantity: number;
  basePrice: number;
  unitPrice: number;
  totalPrice: number;
  actualMargin: number;
  targetMargin: number;
  alertLevel: 'none' | 'yellow' | 'red';
  alertMsg: string;
  logisticsCoefficient: number;
  flexibleReserveAmount: number;
  customFeesTotal: number;
}

export interface QuotationResult {
  items: QuotationItemResult[];
  basePrice: number;
  comprehensiveCoefficient: number;
  totalQuantity: number;
  subtotal: number;
  feesTotal: number;
  total: number;
  alertLevel: 'none' | 'yellow' | 'red';
  alertMsg: string;
  actualMargin: number;
  targetMargin: number;
  afterSalesRate: number;
  marketingExpenseRate: number;
}

interface QuotationEngineSummaryProps {
  result: QuotationResult;
  onReset: () => void;
  calculating?: boolean;
}

function getAlertLevelColor(level: 'none' | 'yellow' | 'red'): string {
  if (level === 'red') return 'text-red-600';
  if (level === 'yellow') return 'text-yellow-600';
  return 'text-green-600';
}

const QuotationEngineSummary = ({
  result,
  onReset,
  calculating,
}: QuotationEngineSummaryProps) => {
  const hasItems: boolean = result.items.length > 0;

  return (
    <div className="min-h-[200px] border-l-[3px] border-l-primary border-y border-r border-border rounded-sm bg-card p-5">
      <div className="mb-3 flex items-center gap-2 border-b border-border pb-2 font-mono text-xs font-bold tracking-wider text-foreground">
        <Calculator className="size-3.5 text-primary" />
        报价摘要
      </div>

      {/* Per-product breakdown */}
      {hasItems && (
        <div className="mb-3 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-bold text-foreground">型号</TableHead>
                <TableHead className="text-xs font-bold text-foreground">颜色</TableHead>
                <TableHead className="text-xs font-bold text-foreground text-right">数量</TableHead>
                <TableHead className="text-xs font-bold text-foreground text-right">单价</TableHead>
                <TableHead className="text-xs font-bold text-foreground text-right">总价</TableHead>
                <TableHead className="text-xs font-bold text-foreground text-right">毛利率</TableHead>
                <TableHead className="text-xs font-bold text-foreground text-right">物流系数</TableHead>
                <TableHead className="text-xs font-bold text-foreground text-right">灵活准备金</TableHead>
                <TableHead className="text-xs font-bold text-foreground text-right">定制费用</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((item: QuotationItemResult, idx: number) => (
                <TableRow key={`${item.model}-${item.color}-${idx}`} className="hover:bg-transparent">
                  <TableCell className="text-xs font-medium">
                    {item.model}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-semibold">
                    {item.color}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    ¥{item.unitPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums font-medium">
                    ¥{item.totalPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`font-mono text-xs font-semibold tabular-nums ${getAlertLevelColor(item.alertLevel)}`}
                      title={item.alertLevel !== 'none' ? item.alertMsg : undefined}
                    >
                      {(item.actualMargin * 100).toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums font-semibold text-foreground/80">
                    {item.logisticsCoefficient.toFixed(4)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums font-semibold text-foreground/80">
                    {item.flexibleReserveAmount > 0
                      ? `¥${item.flexibleReserveAmount.toFixed(2)}`
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {item.customFeesTotal > 0
                      ? `¥${item.customFeesTotal.toFixed(2)}`
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Summary rows */}
      <div className="space-y-1">
        {[
          { label: '商品基价合计', value: `¥${result.basePrice.toFixed(2)}` },
          {
            label: '综合系数',
            value:
              ((1 - result.comprehensiveCoefficient) * 100).toFixed(4) + '%',
          },
          { label: '总数量', value: String(result.totalQuantity) },
          { label: '产品小计', value: `¥${result.subtotal.toFixed(2)}` },
          { label: '一次性费用', value: `¥${result.feesTotal.toFixed(2)}` },
          {
            label: '售后准备金率',
            value: `${(result.afterSalesRate * 100).toFixed(2)}%`,
          },
          {
            label: '超额营销费率',
            value: `${(result.marketingExpenseRate * 100).toFixed(2)}%`,
          },
          {
            label: '综合毛利率',
            value: `${(result.actualMargin * 100).toFixed(1)}%`,
          },
        ].map((row) => (
          <div
            key={row.label}
            className="flex justify-between border-b border-border/50 py-1.5 text-sm"
          >
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-mono font-medium tabular-nums text-foreground">
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* Alert banner */}
      <div
        className={`mt-2 flex items-start gap-2 rounded-sm border px-3 py-2 text-xs ${
          result.alertLevel === 'red'
            ? 'border-destructive/50 bg-destructive/10 text-destructive'
            : result.alertLevel === 'yellow'
              ? 'border-warning/50 bg-warning/10 text-warning'
              : 'border-green-500/30 bg-green-500/5 text-green-600'
        }`}
      >
        {result.alertLevel !== 'none' ? (
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
        ) : (
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
        )}
        <span className="font-medium">
          {result.alertLevel !== 'none' ? result.alertMsg : '无'}
        </span>
      </div>

      {/* Total */}
      <div className="mt-3 border-t-2 border-primary pt-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-foreground">
            整单总报价
          </span>
          <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
            ¥{result.total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReset}
          className="flex-1 rounded-sm text-xs"
        >
          <RotateCcw className="mr-1 size-3.5" />
          重置
        </Button>
      </div>

      {calculating && (
        <div className="mt-2 text-center font-mono text-xs text-muted-foreground">
          计算中...
        </div>
      )}

      <p className="mt-3 text-right font-mono text-[0.6rem] text-muted-foreground">
        所有系数默认为 0.80
      </p>
    </div>
  );
};

export default QuotationEngineSummary;
