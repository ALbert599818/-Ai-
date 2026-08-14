import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { LogisticsCostItem } from '@shared/logistics-cost';

interface StepLogisticsProps {
  logisticsTypes: LogisticsCostItem[];
  selectedLogistics: string;
  onSelectLogistics: (value: string) => void;
  flexibleReserve: number;
  flexibleIsRate: boolean;
  onFlexibleReserveChange: (value: number) => void;
  onFlexibleIsRateChange: (value: boolean) => void;
}

const StepLogistics = ({
  logisticsTypes,
  selectedLogistics,
  onSelectLogistics,
  flexibleReserve,
  flexibleIsRate,
  onFlexibleReserveChange,
  onFlexibleIsRateChange,
}: StepLogisticsProps) => {
  return (
    <div className="border-l-[3px] border-l-primary border-y border-r border-border rounded-sm bg-card p-5">
      <div className="mb-4 border-b border-border pb-2 font-mono text-xs font-semibold tracking-wider text-muted-foreground">
        — 第3步 · 物流与费用设置
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Logistics type */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            物流类型 <span className="text-destructive">*</span>
          </Label>
          <Select value={selectedLogistics} onValueChange={onSelectLogistics}>
            <SelectTrigger className="h-9 rounded-sm border-border text-sm">
              <SelectValue placeholder="选择物流类型" />
            </SelectTrigger>
            <SelectContent>
              {(logisticsTypes ?? []).map((item: LogisticsCostItem) => (
                <SelectItem key={item.id} value={item.costType}>
                  {item.costType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Flexible reserve - pick one of two */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            灵活准备金
          </Label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                onFlexibleIsRateChange(true);
                onFlexibleReserveChange(0);
              }}
              className={`flex items-center gap-1.5 text-xs ${
                flexibleIsRate
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground'
              }`}
            >
              <span
                className={`inline-block size-3.5 rounded-full border-2 ${
                  flexibleIsRate
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground'
                }`}
              >
                {flexibleIsRate && (
                  <span className="block size-1.5 rounded-full bg-primary-foreground m-auto mt-[1px]" />
                )}
              </span>
              按百分比
            </button>
            <button
              type="button"
              onClick={() => {
                onFlexibleIsRateChange(false);
                onFlexibleReserveChange(0);
              }}
              className={`flex items-center gap-1.5 text-xs ${
                !flexibleIsRate
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground'
              }`}
            >
              <span
                className={`inline-block size-3.5 rounded-full border-2 ${
                  !flexibleIsRate
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground'
                }`}
              >
                {!flexibleIsRate && (
                  <span className="block size-1.5 rounded-full bg-primary-foreground m-auto mt-[1px]" />
                )}
              </span>
              按金额
            </button>
          </div>
          {flexibleIsRate ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                step={0.1}
                value={flexibleReserve || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0) onFlexibleReserveChange(val);
                }}
                placeholder="0"
                className="h-9 w-28 rounded-sm border-border font-mono text-sm tabular-nums"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                step={0.01}
                value={flexibleReserve || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0) onFlexibleReserveChange(val);
                }}
                placeholder="0"
                className="h-9 w-28 rounded-sm border-border font-mono text-sm tabular-nums"
              />
              <span className="text-xs text-muted-foreground">元</span>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground">
            {flexibleIsRate
              ? '按折后价的百分比计算灵活准备金'
              : '直接设置固定金额加入报价'}
          </p>
        </div>

      </div>
    </div>
  );
};

export default StepLogistics;
