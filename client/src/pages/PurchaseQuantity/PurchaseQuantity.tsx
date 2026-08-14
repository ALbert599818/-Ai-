import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Upload, Download } from 'lucide-react';
import { toast } from 'sonner';
import { formatDiscount } from '@client/src/utils/format';
const toDiscountInputValue = (value: number | string): string => formatDiscount(value).replace('%', '');
import * as XLSX from 'xlsx';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@client/src/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import {
  getPurchaseQuantityList,
  createPurchaseQuantity,
  updatePurchaseQuantity,
  deletePurchaseQuantity,
  importPurchaseQuantities,
} from '@client/src/api/purchase-quantity';
import type { PurchaseQuantityItem, ImportPurchaseQuantityError } from '@shared/purchase-quantity';
import SuperAdminOnly from '@client/src/components/SuperAdminOnly';

const PAGE_SIZE = 10;

const STOCK_LEVELS = [
  { value: 'below_moq', label: '小于MOQ', minMultiple: 0, maxMultiple: 1 },
  { value: 'moq_to_15moq', label: 'MOQ ~ 1.5MOQ', minMultiple: 1, maxMultiple: 1.5 },
  { value: 'above_15moq', label: '大于1.5倍MOQ', minMultiple: 1.5, maxMultiple: 9999 },
] as const;

type StockLevelValue = typeof STOCK_LEVELS[number]['value'];

const getStockLevelLabel = (min: number, max: number): string => {
  const level = STOCK_LEVELS.find(
    (l) => Math.abs(l.minMultiple - min) < 0.001 && Math.abs(l.maxMultiple - max) < 0.001,
  );
  return level?.label || `${min} ~ ${max} 倍MOQ`;
};

const PurchaseQuantity = () => {
  const [items, setItems] = useState<PurchaseQuantityItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<PurchaseQuantityItem | null>(null);
  const [formLevel, setFormLevel] = useState<StockLevelValue>('below_moq');
  const [formDiscount, setFormDiscount] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<PurchaseQuantityItem | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [importStats, setImportStats] = useState<{ imported: number; updated: number; failed: number } | null>(null);
  const [importErrors, setImportErrors] = useState<ImportPurchaseQuantityError[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPurchaseQuantityList({ page, pageSize: PAGE_SIZE });
      setItems(data.items);
      setTotal(data.total);
    } catch {
      toast.error('获取拿货量数据失败');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setFormLevel('below_moq');
    setFormDiscount('');
    setDialogOpen(true);
  };

  const openEdit = (item: PurchaseQuantityItem) => {
    setEditing(item);
    const min = Number(item.minMultiple) || 0;
    const max = Number(item.maxMultiple) || 0;
    const matched = STOCK_LEVELS.find(
      (l) => Math.abs(l.minMultiple - min) < 0.001 && Math.abs(l.maxMultiple - max) < 0.001,
    );
    setFormLevel(matched?.value || 'below_moq');
    setFormDiscount(toDiscountInputValue(item.discount));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const discountNum = parseFloat(formDiscount) / 100;
    if (isNaN(discountNum)) {
      toast.error('请输入有效的系数值');
      return;
    }
    const level = STOCK_LEVELS.find((l) => l.value === formLevel);
    if (!level) return;

    setSaving(true);
    try {
      if (editing) {
        await updatePurchaseQuantity(editing.id, {
          typeDesc: level.label,
          discount: discountNum,
          minMultiple: level.minMultiple,
          maxMultiple: level.maxMultiple,
        });
        toast.success('更新成功');
      } else {
        await createPurchaseQuantity({
          typeDesc: level.label,
          discount: discountNum,
          minMultiple: level.minMultiple,
          maxMultiple: level.maxMultiple,
        });
        toast.success('创建成功');
      }
      setDialogOpen(false);
      fetchData();
    } catch {
      toast.error(editing ? '更新失败' : '创建失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePurchaseQuantity(deleteTarget.id);
      toast.success('删除成功');
      setDeleteTarget(null);
      const maxPage = Math.max(1, Math.ceil((total - 1) / PAGE_SIZE));
      if (page > maxPage) {
        setPage(maxPage);
      } else {
        fetchData();
      }
    } catch {
      toast.error('删除失败');
      setDeleteTarget(null);
    }
  };

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['库存档位', '系数(%)'],
      ['小于MOQ', 5],
      ['MOQ ~ 1.5MOQ', 3],
      ['大于1.5倍MOQ', 1],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, '拿货量系数');
    XLSX.writeFile(wb, '拿货量系数导入模板.xlsx');
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setImporting(true);
    setImportStats(null);
    setImportErrors([]);
    try {
      const data = new Uint8Array(await file.arrayBuffer());
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        toast.error('Excel 文件中没有工作表');
        setImporting(false);
        return;
      }
      const sheet = workbook.Sheets[sheetName];
      const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (rows.length < 2) {
        toast.error('Excel 文件中没有数据行');
        setImporting(false);
        return;
      }

      const headerRow = (rows[0] || []).map((h: string) => String(h ?? '').trim());
      const levelIdx = headerRow.findIndex(
        (h: string) => h.includes('库存档位') || h.includes('档位') || h.includes('类型'),
      );
      const discountIdx = headerRow.findIndex(
        (h: string) => h.includes('系数') || h.includes('折扣'),
      );

      if (levelIdx < 0 || discountIdx < 0) {
        toast.error('模板缺少必要列：库存档位、系数(%)');
        setImporting(false);
        return;
      }

      const parsedRows = rows.slice(1).map((row: string[]) => {
        const levelLabel = String(row[levelIdx] ?? '').trim();
        const matched = STOCK_LEVELS.find(
          (l) => l.label === levelLabel || l.value === levelLabel,
        );
        return {
          typeDesc: matched?.label || levelLabel,
          discount: String(row[discountIdx] ?? '').trim(),
          minMultiple: matched ? String(matched.minMultiple) : '',
          maxMultiple: matched ? String(matched.maxMultiple) : '',
        };
      });

      const result = await importPurchaseQuantities(parsedRows);
      setImportStats({ imported: result.imported, updated: result.updated, failed: result.failed });
      setImportErrors(result.errors);
      if (result.imported + result.updated > 0) {
        toast.success(`导入完成：新增 ${result.imported} 条，更新 ${result.updated} 条`);
        fetchData();
      }
      if (result.failed > 0 && result.imported + result.updated === 0) {
        toast.error('导入失败，请检查错误详情');
      }
    } catch {
      toast.error('文件解析或导入失败');
    } finally {
      setImporting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-lg font-semibold text-foreground">
          拿货量系数录入
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
            className="gap-1.5"
          >
            <Download className="size-4" />
            下载模板
          </Button>
          <SuperAdminOnly>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportDialogOpen(true)}
              className="gap-1.5"
            >
              <Upload className="size-4" />
              批量导入
            </Button>
          </SuperAdminOnly>
          <SuperAdminOnly>
            <Button onClick={openCreate} className="gap-1.5">
              <Plus className="size-4" />
              新建
            </Button>
          </SuperAdminOnly>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            加载中...
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
            暂无数据
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border border-border">
                <th className="border border-border bg-accent/50 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  库存档位
                </th>
                <th className="border border-border bg-accent/50 px-4 py-2.5 text-right text-xs font-medium text-muted-foreground w-[160px]">
                  系数
                </th>
                <th className="border border-border bg-accent/50 px-4 py-2.5 text-center text-xs font-medium text-muted-foreground w-[120px]">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: PurchaseQuantityItem) => (
                <tr
                  key={item.id}
                  className="border-x border-b border-border hover:bg-accent/30 transition-colors"
                >
                  <td className="px-4 py-2.5 text-foreground">
                    {getStockLevelLabel(Number(item.minMultiple) || 0, Number(item.maxMultiple) || 0)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-foreground">
                    {formatDiscount(item.discount)}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <SuperAdminOnly>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(item)}
                          className="h-7 px-2 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      </SuperAdminOnly>
                      <SuperAdminOnly>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(item)}
                          className="h-7 px-2 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </SuperAdminOnly>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between border-t border-border px-6 py-3">
          <span className="text-xs text-muted-foreground">
            共 {total} 条记录，第 {page}/{totalPages} 页
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              下一页
            </Button>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-sm max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑' : '新建'}拿货量系数</DialogTitle>
            <DialogDescription>
              根据库存相对于MOQ的档位维护对应的系数
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                库存档位
              </label>
              <Select value={formLevel} onValueChange={(v) => setFormLevel(v as StockLevelValue)}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择库存档位" />
                </SelectTrigger>
                <SelectContent>
                  {STOCK_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                系数（%）
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="例如：5 表示 5%"
                value={formDiscount}
                onChange={(e) => setFormDiscount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                输入百分比数字，如 5 表示系数为 0.95（95折）
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除该拿货量系数吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="rounded-sm max-w-lg">
          <DialogHeader>
            <DialogTitle>批量导入拿货量系数</DialogTitle>
            <DialogDescription>
              请选择 Excel 文件（.xlsx），已存在的库存档位将被更新
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-sm p-8">
              {importing ? (
                <div className="text-sm text-muted-foreground">
                  正在解析并导入数据...
                </div>
              ) : (
                <>
                  <Upload className="size-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">
                    点击选择或拖拽 Excel 文件到此处
                  </p>
                  <label>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleImportFile}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        const input = (
                          e.currentTarget
                            .previousElementSibling as HTMLInputElement
                        );
                        input?.click();
                      }}
                      asChild
                    >
                      <span>选择文件</span>
                    </Button>
                  </label>
                </>
              )}
            </div>

            {importStats && (
              <div className="space-y-2">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-foreground">
                    新增：
                    <span className="font-mono font-medium text-emerald-600">
                      {importStats.imported}
                    </span>{' '}
                    条
                  </span>
                  <span className="text-foreground">
                    更新：
                    <span className="font-mono font-medium text-blue-600">
                      {importStats.updated}
                    </span>{' '}
                    条
                  </span>
                  {importStats.failed > 0 && (
                    <span className="text-foreground">
                      失败：
                      <span className="font-mono font-medium text-destructive">
                        {importStats.failed}
                      </span>{' '}
                      条
                    </span>
                  )}
                </div>
                {importErrors.length > 0 && (
                  <div className="max-h-[200px] overflow-auto border border-border rounded-sm">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-accent/50">
                          <th className="border border-border px-3 py-1.5 text-left font-medium text-muted-foreground w-[60px]">
                            行号
                          </th>
                          <th className="border border-border px-3 py-1.5 text-left font-medium text-muted-foreground">
                            错误信息
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {importErrors.map(
                          (err: ImportPurchaseQuantityError, idx: number) => (
                            <tr
                              key={idx}
                              className="border-x border-b border-border"
                            >
                              <td className="px-3 py-1.5 text-muted-foreground font-mono">
                                {err.row}
                              </td>
                              <td className="px-3 py-1.5 text-destructive">
                                {err.message}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(false)}
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseQuantity;
