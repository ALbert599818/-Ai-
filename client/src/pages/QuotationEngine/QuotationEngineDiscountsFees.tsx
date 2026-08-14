import { useState, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { logger } from '@/lib/lark-shim/logger';
import { customFeeConfigApi } from '@client/src/api';
import type { CustomFeeConfigItem } from '@shared/custom-fee-config';
import type { OtherDiscountItem } from '@shared/other-discount';

export interface FeeItem {
  id: string;
  project: string;
  content: string;
  amount: number;
}

interface QuotationEngineDiscountsFeesProps {
  otherDiscounts: OtherDiscountItem[];
  enabledDiscounts: Set<string>;
  onToggleDiscount: (id: string) => void;
  fees: FeeItem[];
  onAddFee: (fee: FeeItem) => void;
  onRemoveFee: (id: string) => void;
}

const QuotationEngineDiscountsFees = ({
  otherDiscounts,
  enabledDiscounts,
  onToggleDiscount,
  fees,
  onAddFee,
  onRemoveFee,
}: QuotationEngineDiscountsFeesProps) => {
  const [feeProject, setFeeProject] = useState('');
  const [feeContent, setFeeContent] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [feeProjects, setFeeProjects] = useState<string[]>([]);

  useEffect(() => {
    const loadFeeConfigs = async () => {
      try {
        const res = await customFeeConfigApi.getCustomFeeConfigList({ pageSize: 100 });
        const names: string[] = (res.items as CustomFeeConfigItem[]).map(
          (item: CustomFeeConfigItem) => item.name,
        );
        setFeeProjects(names);
      } catch (error) {
        logger.error('加载定制费用配置失败', error);
      }
    };
    loadFeeConfigs();
  }, []);

  const totalFees = fees.reduce((sum: number, f: FeeItem) => sum + f.amount, 0);

  const handleAddFee = () => {
    const amount = parseFloat(feeAmount);
    if (!feeProject || isNaN(amount) || amount <= 0) return;
    onAddFee({
      id: `fee-${Date.now()}`,
      project: feeProject,
      content: feeContent,
      amount,
    });
    setFeeProject('');
    setFeeContent('');
    setFeeAmount('');
  };

  return (
    <div className="border-l-[3px] border-l-primary border-y border-r border-border rounded-sm bg-card p-5">
      <div className="mb-4 border-b border-border pb-2 font-mono text-xs font-bold tracking-wider text-foreground">
        — 第4步 · 客户定制费用
      </div>

      {/* Other discounts */}
      <div className="mb-5">
        <h4 className="mb-2 text-xs font-bold text-foreground">
          其他折扣 (勾选生效)
        </h4>
        <div className="space-y-2">
          {otherDiscounts.map((item: OtherDiscountItem) => (
            <div key={item.id} className="flex items-center gap-2">
              <Checkbox
                id={`discount-${item.id}`}
                checked={enabledDiscounts.has(item.id)}
                onCheckedChange={() => onToggleDiscount(item.id)}
                className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label
                htmlFor={`discount-${item.id}`}
                className="cursor-pointer text-sm text-foreground"
              >
                {item.discountType} (+{item.discount})
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* One-time fees */}
      <div>
        <h4 className="mb-2 text-xs font-bold text-foreground">一次性费用</h4>

        {fees.length > 0 && (
          <div className="mb-3 overflow-hidden rounded-sm border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-accent">
                  <th className="px-3 py-1.5 text-left font-bold text-foreground">项目</th>
                  <th className="px-3 py-1.5 text-left font-bold text-foreground">具体内容</th>
                  <th className="px-3 py-1.5 text-right font-bold text-foreground">费用 (¥)</th>
                  <th className="px-3 py-1.5 text-center font-bold text-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((fee: FeeItem) => (
                  <tr key={fee.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-1.5 text-foreground">{fee.project}</td>
                    <td className="px-3 py-1.5 text-foreground/80 font-semibold">{fee.content || '-'}</td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums text-foreground">
                      {fee.amount.toFixed(2)}
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => onRemoveFee(fee.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add fee form */}
          <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[100px] flex-1">
            <Select value={feeProject} onValueChange={setFeeProject}>
              <SelectTrigger className="h-8 w-[140px] rounded-sm border-border bg-card text-xs">
                <SelectValue placeholder="项目" />
              </SelectTrigger>
              <SelectContent>
                {feeProjects.length > 0 ? (
                  feeProjects.map((name: string) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    暂无配置项
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          <Input
            value={feeContent}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFeeContent(e.target.value)}
            placeholder="具体内容"
            className="h-8 min-w-[100px] flex-1 rounded-sm border-border bg-card text-xs"
          />
          <Input
            type="number"
            min={0}
            value={feeAmount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFeeAmount(e.target.value)}
            placeholder="费用"
            className="h-8 w-20 rounded-sm border-border bg-card text-xs font-mono tabular-nums"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAddFee}
            disabled={!feeProject || !feeAmount}
            className="h-8 rounded-sm px-3 text-xs"
          >
            <Plus className="mr-1 size-3" /> 添加
          </Button>
        </div>

        {totalFees > 0 && (
          <div className="mt-2 flex items-center justify-end gap-1 text-xs text-muted-foreground">
            <span className="rounded-sm bg-accent px-2 py-0.5 font-mono font-semibold text-foreground">
              费用合计: ¥{totalFees.toFixed(2)}
            </span>
            <span className="text-[10px]">费用累加至总报价</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationEngineDiscountsFees;
