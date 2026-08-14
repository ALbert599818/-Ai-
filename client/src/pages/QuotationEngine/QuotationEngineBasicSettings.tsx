import { SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { LogisticsCostItem } from '@shared/logistics-cost';

interface QuotationEngineBasicSettingsProps {
  logisticsTypes: LogisticsCostItem[];
  selectedLogistics: string;
  onSelectLogistics: (value: string) => void;
  quantity: number;
  onQuantityChange: (value: number) => void;
}

const QuotationEngineBasicSettings = ({
  logisticsTypes,
  selectedLogistics,
  onSelectLogistics,
  quantity,
  onQuantityChange,
}: QuotationEngineBasicSettingsProps) => {
  return (
    <div className="rounded-[20px] border border-[#e9edf2] bg-[#f9fbfd] p-5">
      <div className="mb-4 flex items-center gap-2 border-b border-dashed border-[#d8e2ed] pb-3 text-sm font-semibold text-[#1f4866]">
        <SlidersHorizontal className="size-4 text-[#2a7de1]" />
        基础设置
      </div>

      <div className="flex gap-4">
        {/* Logistics type */}
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs font-bold text-foreground/90">物流类型</Label>
          <Select value={selectedLogistics} onValueChange={onSelectLogistics}>
            <SelectTrigger className="h-9 rounded-lg border-[#cddae6] bg-white text-sm focus:border-[#2a7de1] focus:ring-1 focus:ring-[#2a7de1]">
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

        {/* Quantity */}
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs font-bold text-foreground/90">数量 (件)</Label>
          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val > 0) onQuantityChange(val);
            }}
            className="h-9 rounded-lg border-[#cddae6] bg-white text-sm tabular-nums focus:border-[#2a7de1] focus:ring-1 focus:ring-[#2a7de1]"
          />
        </div>
      </div>
    </div>
  );
};

export default QuotationEngineBasicSettings;
