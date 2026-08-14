import { useState, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import type { ProductRow, InlineFeeItem } from './StepProduct';

interface ProductInlinePanelProps {
  row: ProductRow;
  logisticsOptions: string[];
  onChange: (updates: Partial<ProductRow>) => void;
}

const ProductInlinePanel = ({
  row,
  logisticsOptions,
  onChange,
}: ProductInlinePanelProps) => {
  const [feeProject, setFeeProject] = useState('');
  const [feeContent, setFeeContent] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [feeProjects, setFeeProjects] = useState<string[]>([]);

  useEffect(() => {
    const loadFeeConfigs = async () => {
      try {
        const res = await customFeeConfigApi.getCustomFeeConfigList({
          pageSize: 100,
        });
        const names: string[] = (
          res.items as CustomFeeConfigItem[]
        ).map((item: CustomFeeConfigItem) => item.name);
        setFeeProjects(names);
      } catch (error) {
        logger.error('加载定制费用配置失败', error);
      }
    };
    loadFeeConfigs();
  }, []);

  const handleAddFee = () => {
    const amount = parseFloat(feeAmount);
    if (!feeProject || isNaN(amount) || amount <= 0) return;
    const newFee: InlineFeeItem = {
      id: `fee-${Date.now()}`,
      project: feeProject,
      content: feeContent,
      amount,
    };
    onChange({ customFees: [...row.customFees, newFee] });
    setFeeProject('');
    setFeeContent('');
    setFeeAmount('');
  };

  const handleRemoveFee = (feeId: string) => {
    onChange({
      customFees: row.customFees.filter(
        (f: InlineFeeItem) => f.id !== feeId,
      ),
    });
  };

  const totalFees: number = row.customFees.reduce(
    (sum: number, f: InlineFeeItem) => sum + f.amount,
    0,
  );

  return (
    <div className="space-y-4 py-3">
      {/* Section 1: Logistics & Reserve */}
      <div>
        <h5 className="mb-2 text-xs font-bold text-foreground">
          物流与费用设置
        </h5>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Logistics type */}
          <div className="space-y-1">
            <Label className="text-[11px] text-foreground/80 font-semibold">
              物流类型
            </Label>
            <Select
              value={row.logisticsType || '_empty_'}
              onValueChange={(v: string) =>
                onChange({ logisticsType: v })
              }
            >
              <SelectTrigger className="h-8 rounded-sm border-border text-xs">
                <SelectValue placeholder="选择物流类型" />
              </SelectTrigger>
              <SelectContent>
                {logisticsOptions.length === 0 ? (
                  <SelectItem value="no-config" disabled>
                    暂无物流配置（请先在【拿货量与物流】中配置）
                  </SelectItem>
                ) : (
                  logisticsOptions.map((opt: string) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Flexible reserve */}
          <div className="space-y-1">
            <Label className="text-[11px] text-foreground/80 font-semibold">
              灵活准备金
            </Label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onChange({ flexibleIsRate: true, flexibleReserve: 0 })
                }
                className={`flex items-center gap-1 text-[11px] ${
                  row.flexibleIsRate
                    ? 'font-medium text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                <span
                  className={`inline-block size-3 rounded-full border-2 ${
                    row.flexibleIsRate
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground'
                  }`}
                />
                按百分比
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    flexibleIsRate: false,
                    flexibleReserve: 0,
                  })
                }
                className={`flex items-center gap-1 text-[11px] ${
                  !row.flexibleIsRate
                    ? 'font-medium text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                <span
                  className={`inline-block size-3 rounded-full border-2 ${
                    !row.flexibleIsRate
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground'
                  }`}
                />
                按金额
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={0}
                step={row.flexibleIsRate ? 0.1 : 0.01}
                value={row.flexibleReserve || ''}
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement>,
                ) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0) {
                    onChange({ flexibleReserve: val });
                  }
                }}
                placeholder="0"
                className="h-8 w-24 rounded-sm border-border font-mono text-xs tabular-nums"
              />
              <span className="text-[11px] text-foreground/80 font-semibold">
                {row.flexibleIsRate ? '%' : '元'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Custom fees */}
      <div>
        <h5 className="mb-2 text-xs font-bold text-foreground">
          客户定制费用
        </h5>

        {row.customFees.length > 0 && (
          <div className="mb-2 overflow-hidden rounded-sm border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-accent/50">
                  <th className="px-2.5 py-1.5 text-left font-bold text-foreground">
                    项目
                  </th>
                  <th className="px-2.5 py-1.5 text-left font-bold text-foreground">
                    具体内容
                  </th>
                  <th className="px-2.5 py-1.5 text-right font-bold text-foreground">
                    费用 (¥)
                  </th>
                  <th className="w-10 px-2.5 py-1.5 text-center font-bold text-foreground">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {row.customFees.map((fee: InlineFeeItem) => (
                  <tr
                    key={fee.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-2.5 py-1.5 text-foreground">
                      {fee.project}
                    </td>
                    <td className="px-2.5 py-1.5 text-foreground/80 font-semibold">
                      {fee.content || '—'}
                    </td>
                    <td className="px-2.5 py-1.5 text-right font-mono tabular-nums text-foreground">
                      {fee.amount.toFixed(2)}
                    </td>
                    <td className="px-2.5 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveFee(fee.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3" />
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
          <Select value={feeProject} onValueChange={setFeeProject}>
            <SelectTrigger className="h-7 w-[120px] rounded-sm border-border bg-card text-xs">
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
          <Input
            value={feeContent}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFeeContent(e.target.value)
            }
            placeholder="具体内容"
            className="h-7 w-[120px] rounded-sm border-border bg-card text-xs"
          />
          <Input
            type="number"
            min={0}
            value={feeAmount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFeeAmount(e.target.value)
            }
            placeholder="费用"
            className="h-7 w-20 rounded-sm border-border bg-card font-mono text-xs tabular-nums"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAddFee}
            disabled={!feeProject || !feeAmount}
            className="h-7 rounded-sm px-2 text-xs"
          >
            <Plus className="mr-0.5 size-3" /> 添加
          </Button>
        </div>

        {totalFees > 0 && (
          <div className="mt-1.5 text-right text-[11px] text-foreground/80 font-semibold">
            费用合计:{' '}
            <span className="font-mono font-bold text-foreground">
              ¥{totalFees.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductInlinePanel;
