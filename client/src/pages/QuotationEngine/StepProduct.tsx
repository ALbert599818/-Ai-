import { Fragment, useMemo } from 'react';
import { Plus, Trash2, Upload, Download, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { logger } from '@/lib/lark-shim/logger';
import * as XLSX from 'xlsx';
import type { ProductItem } from '@shared/product';
import ProductInlinePanel from './ProductInlinePanel';
import { downloadTemplate } from './QuotationTemplateDownload';

export interface InlineFeeItem {
  id: string;
  project: string;
  content: string;
  amount: number;
}

export interface ProductRow {
  id: string;
  model: string;
  color: string;
  quantity: number;
  moq: number;
  basePrice: number;
  unitPrice: number;
  totalPrice: number;
  actualMargin: number;
  alertLevel: 'none' | 'yellow' | 'red';
  alertMsg: string;
  logisticsType: string;
  flexibleReserve: number;
  flexibleIsRate: boolean;
  customFees: InlineFeeItem[];
  expanded: boolean;
  logisticsCoefficient?: number;
  flexibleReserveAmount?: number;
  customFeesTotal?: number;
}

export const EMPTY_PRODUCT_ROW = (): ProductRow => ({
  id: crypto.randomUUID(),
  model: '',
  color: '',
  quantity: 1,
  moq: 0,
  basePrice: 0,
  unitPrice: 0,
  totalPrice: 0,
  actualMargin: 0,
  alertLevel: 'none',
  alertMsg: '',
  logisticsType: '散货',
  flexibleReserve: 0,
  flexibleIsRate: true,
  customFees: [],
  expanded: false,
});

interface StepProductProps {
  allProducts: ProductItem[];
  productRows: ProductRow[];
  logisticsOptions: string[];
  onAddRow: () => void;
  onRemoveRow: (id: string) => void;
  onUpdateRow: (id: string, data: Partial<ProductRow>) => void;
  onClearAll: () => void;
  onImportProducts: (rows: ProductRow[]) => void;
}

function getBasePrice(p: ProductItem): number {
  const pc = Number(p.purchaseCost) || 0;
  const rc = Number(p.rdCost) || 0;
  if (pc > 0) return pc + rc;
  return Number(p.purchasePrice) || 0;
}

function findHeaderIndex(
  headers: string[],
  patterns: string[],
): number {
  return headers.findIndex((h: string) =>
    patterns.some((p: string) => String(h).includes(p)),
  );
}

const StepProduct = ({
  allProducts,
  productRows,
  logisticsOptions,
  onAddRow,
  onRemoveRow,
  onUpdateRow,
  onClearAll,
  onImportProducts,
}: StepProductProps) => {
  const uniqueModels: string[] = useMemo(
    () => [...new Set(allProducts.map((p: ProductItem) => p.model))],
    [allProducts],
  );

  const colorsByModel = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const p of allProducts) {
      const existing = map.get(p.model) ?? [];
      if (!existing.includes(p.color)) existing.push(p.color);
      map.set(p.model, existing);
    }
    return map;
  }, [allProducts]);

  const handleModelChange = (rowId: string, model: string) => {
    onUpdateRow(rowId, {
      model,
      color: '',
      moq: 0,
      basePrice: 0,
      unitPrice: 0,
      totalPrice: 0,
      actualMargin: 0,
      alertLevel: 'none',
      alertMsg: '',
      expanded: false,
    });
  };

  const handleColorChange = (rowId: string, color: string) => {
    const row = productRows.find((r: ProductRow) => r.id === rowId);
    const product = allProducts.find(
      (p: ProductItem) => p.model === (row?.model ?? '') && p.color === color,
    );
    onUpdateRow(rowId, {
      color,
      moq: product?.moq ?? 0,
      basePrice: product ? getBasePrice(product) : 0,
      unitPrice: 0,
      totalPrice: 0,
      actualMargin: 0,
      alertLevel: 'none',
      alertMsg: '',
      expanded: true,
    });
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = evt.target?.result;
          const wb = XLSX.read(data, { type: 'binary' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(ws, {
            header: 1,
          }) as unknown[][];

          if (rows.length < 2) {
            toast.error('Excel 文件为空或格式不正确');
            return;
          }

          const headers = (rows[0] as unknown[]).map((h: unknown) =>
            String(h ?? ''),
          );
          const mi = findHeaderIndex(headers, ['型号', 'model']);
          const ci = findHeaderIndex(headers, ['颜色', 'color']);
          const qi = findHeaderIndex(headers, ['数量', 'quantity', 'qty']);

          if (mi === -1 || ci === -1 || qi === -1) {
            toast.error(
              'Excel 必须包含"产品型号"、"颜色"、"数量"三列',
            );
            return;
          }

          const imported: ProductRow[] = [];
          const errors: string[] = [];

          for (let i = 1; i < rows.length; i++) {
            const r = rows[i] as unknown[];
            if (!r || r.length === 0) continue;

            const model = String(r[mi] ?? '').trim();
            const color = String(r[ci] ?? '').trim();
            const qty = parseInt(String(r[qi] ?? '1'), 10);

            if (!model && !color) continue;
            if (!model || !color) {
              errors.push(`第 ${i + 1} 行: 型号或颜色缺失`);
              continue;
            }

            const product = allProducts.find(
              (p: ProductItem) => p.model === model && p.color === color,
            );
            imported.push({
              ...EMPTY_PRODUCT_ROW(),
              model,
              color,
              quantity: isNaN(qty) || qty < 1 ? 1 : qty,
              moq: product?.moq ?? 0,
              basePrice: product ? getBasePrice(product) : 0,
              expanded: true,
            });
          }

          if (errors.length > 0) {
            toast.error(errors.slice(0, 3).join('; '));
          }
          if (imported.length > 0) {
            onImportProducts(imported);
            toast.success(`成功导入 ${imported.length} 条产品`);
          } else if (errors.length === 0) {
            toast.error('未解析到有效数据');
          }
        } catch (err) {
          logger.error('Excel parse error', err);
          toast.error('Excel 解析失败，请检查文件格式');
        }
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      logger.error('Excel read error', err);
      toast.error('文件读取失败');
    }
    e.target.value = '';
  };

  const colorsForRow = (model: string): string[] =>
    colorsByModel.get(model) ?? [];

  const toggleExpand = (rowId: string) => {
    const row = productRows.find((r: ProductRow) => r.id === rowId);
    if (row) {
      onUpdateRow(rowId, { expanded: !row.expanded });
    }
  };

  return (
    <div className="border-l-[3px] border-l-primary border-y border-r border-border rounded-sm bg-card p-5">
      <div className="mb-4 border-b border-border pb-2 font-mono text-xs font-bold tracking-wider text-foreground">
        — 第2步 · 产品明细
      </div>

      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddRow}
          className="gap-1 rounded-sm text-xs"
        >
          <Plus className="size-3.5" />
          添加产品
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 rounded-sm text-xs"
            >
              <Upload className="size-3.5" />
              批量导入
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>批量导入产品</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <p className="text-xs text-muted-foreground">
                Excel 需包含三列：<strong>产品型号</strong>、
                <strong>颜色</strong>、<strong>数量</strong>
                （第一行为表头）
              </p>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelImport}
                className="h-9 rounded-sm border-border text-sm"
              />
            </div>
          </DialogContent>
        </Dialog>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={downloadTemplate}
          className="gap-1 rounded-sm text-xs"
        >
          <Download className="size-3.5" />
          模板下载
        </Button>
        {productRows.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="gap-1 rounded-sm text-xs text-muted-foreground"
          >
            <X className="size-3.5" />
            清空全部
          </Button>
        )}
      </div>

      {/* Product table */}
      {productRows.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          暂无产品，点击上方「添加产品」、「批量导入」或「模板下载」
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[140px]">产品型号</TableHead>
                <TableHead className="min-w-[120px]">颜色</TableHead>
                <TableHead className="min-w-[90px]">数量</TableHead>
                <TableHead className="min-w-[60px]">MOQ</TableHead>
                <TableHead className="min-w-[80px]">单价</TableHead>
                <TableHead className="min-w-[80px]">总价</TableHead>
                <TableHead className="w-[50px]" />
                <TableHead className="w-[40px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {productRows.map((row: ProductRow) => (
                <Fragment key={row.id}>
                  {/* Product label row — 8 cells aligned with table header */}
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="bg-primary/5 border-l-4 border-l-primary py-2 text-sm font-medium text-foreground">
                      【产品型号】{row.model || '—'}
                    </TableCell>
                    <TableCell className="bg-primary/5 py-2 text-sm font-medium text-foreground">
                      【颜色】{row.color || '—'}
                    </TableCell>
                    <TableCell className="bg-primary/5 py-2 text-sm font-medium text-foreground">
                      【数量】{row.quantity}
                    </TableCell>
                    <TableCell className="bg-primary/5 py-2 text-sm text-foreground font-semibold">
                      【MOQ】{row.moq ?? '—'}
                    </TableCell>
                    <TableCell className="bg-primary/5 py-2 text-sm text-foreground font-semibold">
                      【单价】{row.unitPrice ?? '—'}
                    </TableCell>
                    <TableCell className="bg-primary/5 py-2 text-sm text-foreground font-semibold">
                      【总价】{row.totalPrice ?? '—'}
                    </TableCell>
                    <TableCell className="bg-primary/5 py-2" />
                    <TableCell className="bg-primary/5 py-2" />
                  </TableRow>
                  {/* Main data row */}
                  <TableRow className="hover:bg-transparent">
                    {/* Model select */}
                    <TableCell>
                      <Select
                        value={row.model || '_empty_'}
                        onValueChange={(v: string) =>
                          handleModelChange(row.id, v)
                        }
                      >
                        <SelectTrigger className="h-8 w-full rounded-sm border-border text-xs">
                          <SelectValue placeholder="请选择产品型号" />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueModels.map((m: string) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Color select */}
                    <TableCell>
                      <Select
                        value={row.color || '_empty_'}
                        onValueChange={(v: string) =>
                          handleColorChange(row.id, v)
                        }
                        disabled={!row.model}
                      >
                        <SelectTrigger className="h-8 w-full rounded-sm border-border text-xs">
                          <SelectValue placeholder="请选择颜色" />
                        </SelectTrigger>
                        <SelectContent>
                          {colorsForRow(row.model).map((c: string) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Quantity */}
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        value={row.quantity}
                        onChange={(
                          e: React.ChangeEvent<HTMLInputElement>,
                        ) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val > 0) {
                            onUpdateRow(row.id, { quantity: val });
                          }
                        }}
                        className="h-8 w-20 rounded-sm border-border font-mono text-xs tabular-nums"
                      />
                    </TableCell>

                    {/* MOQ (readonly) */}
                    <TableCell className="font-mono text-xs tabular-nums text-foreground/80 font-semibold">
                      {row.moq}
                    </TableCell>

                    {/* Unit price (readonly) */}
                    <TableCell className="font-mono text-xs tabular-nums">
                      {row.unitPrice > 0
                        ? `¥${row.unitPrice.toFixed(2)}`
                        : '—'}
                    </TableCell>

                    {/* Total price (readonly) */}
                    <TableCell className="font-mono text-xs tabular-nums font-medium">
                      {row.totalPrice > 0
                        ? `¥${row.totalPrice.toFixed(2)}`
                        : '—'}
                    </TableCell>

                    {/* Delete */}
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveRow(row.id)}
                        className="size-7 rounded-sm p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TableCell>

                    {/* Expand/Collapse */}
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(row.id)}
                        disabled={!row.model || !row.color}
                        className="size-7 rounded-sm p-0 text-muted-foreground hover:text-foreground"
                        title={row.expanded ? '收起设置' : '展开物流与费用设置'}
                      >
                        {row.expanded ? (
                          <ChevronUp className="size-3.5" />
                        ) : (
                          <ChevronDown className="size-3.5" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* Inline panel row */}
                  {row.expanded && row.model && row.color && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={8} className="bg-accent/20 p-0">
                        <div className="px-4">
                          <ProductInlinePanel
                            row={row}
                            logisticsOptions={logisticsOptions}
                            onChange={(updates: Partial<ProductRow>) =>
                              onUpdateRow(row.id, updates)
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default StepProduct;
