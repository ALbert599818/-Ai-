import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Upload, Download } from 'lucide-react';
import { toast } from 'sonner';
import { formatDiscount } from '@client/src/utils/format';
const toDiscountInputValue = (value: number | string): string => formatDiscount(value).replace('%', '');
import * as XLSX from 'xlsx';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@client/src/components/ui/tabs';
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
import {
  getLogisticsCostList,
  createLogisticsCost,
  updateLogisticsCost,
  deleteLogisticsCost,
} from '@client/src/api/logistics-cost';
import type { PurchaseQuantityItem, ImportPurchaseQuantityError } from '@shared/purchase-quantity';
import type { LogisticsCostItem } from '@shared/logistics-cost';
import SuperAdminOnly from '@client/src/components/SuperAdminOnly';

const PAGE_SIZE = 10;
const LOGISTICS_COST_TYPES = ['散货', '整柜（20尺柜）', '整柜（40尺柜）'];

const PurchaseLogistics = () => {
  // === Purchase Quantity State ===
  const [pqItems, setPqItems] = useState<PurchaseQuantityItem[]>([]);
  const [pqTotal, setPqTotal] = useState<number>(0);
  const [pqPage, setPqPage] = useState<number>(1);
  const [pqLoading, setPqLoading] = useState<boolean>(false);
  const [pqDialogOpen, setPqDialogOpen] = useState<boolean>(false);
  const [pqEditing, setPqEditing] = useState<PurchaseQuantityItem | null>(null);
  const [pqFormDesc, setPqFormDesc] = useState<string>('');
  const [pqFormDiscount, setPqFormDiscount] = useState<string>('');
  const [pqFormMinMultiple, setPqFormMinMultiple] = useState<string>('');
  const [pqFormMaxMultiple, setPqFormMaxMultiple] = useState<string>('');
  const [pqSaving, setPqSaving] = useState<boolean>(false);
  const [pqDeleteTarget, setPqDeleteTarget] = useState<PurchaseQuantityItem | null>(null);
  const [pqImportDialogOpen, setPqImportDialogOpen] = useState<boolean>(false);
  const [pqImporting, setPqImporting] = useState<boolean>(false);
  const [pqImportStats, setPqImportStats] = useState<{ imported: number; updated: number; failed: number } | null>(null);
  const [pqImportErrors, setPqImportErrors] = useState<ImportPurchaseQuantityError[]>([]);

  // === Logistics Cost State ===
  const [lcItems, setLcItems] = useState<LogisticsCostItem[]>([]);
  const [lcTotal, setLcTotal] = useState<number>(0);
  const [lcPage, setLcPage] = useState<number>(1);
  const [lcLoading, setLcLoading] = useState<boolean>(false);
  const [lcDialogOpen, setLcDialogOpen] = useState<boolean>(false);
  const [lcEditing, setLcEditing] = useState<LogisticsCostItem | null>(null);
  const [lcFormType, setLcFormType] = useState<string>(LOGISTICS_COST_TYPES[0]);
  const [lcFormDiscount, setLcFormDiscount] = useState<string>('');
  const [lcSaving, setLcSaving] = useState<boolean>(false);
  const [lcDeleteTarget, setLcDeleteTarget] = useState<LogisticsCostItem | null>(null);

  // === Data Fetching ===
  const fetchPqData = useCallback(async (page: number) => {
    setPqLoading(true);
    try {
      const data = await getPurchaseQuantityList({ page, pageSize: PAGE_SIZE });
      setPqItems(data.items);
      setPqTotal(data.total);
    } catch {
      toast.error('获取拿货量数据失败');
    } finally {
      setPqLoading(false);
    }
  }, []);

  const fetchLcData = useCallback(async (page: number) => {
    setLcLoading(true);
    try {
      const data = await getLogisticsCostList({ page, pageSize: PAGE_SIZE });
      setLcItems(data.items);
      setLcTotal(data.total);
    } catch {
      toast.error('获取物流成本数据失败');
    } finally {
      setLcLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPqData(pqPage);
  }, [pqPage, fetchPqData]);

  useEffect(() => {
    fetchLcData(lcPage);
  }, [lcPage, fetchLcData]);

  // === Purchase Quantity Handlers ===
  const openPqCreate = () => {
    setPqEditing(null);
    setPqFormDesc('');
    setPqFormDiscount('');
    setPqFormMinMultiple('');
    setPqFormMaxMultiple('');
    setPqDialogOpen(true);
  };

  const openPqEdit = (item: PurchaseQuantityItem) => {
    setPqEditing(item);
    setPqFormDesc(item.typeDesc);
    setPqFormDiscount(toDiscountInputValue(item.discount));
    setPqFormMinMultiple(item.minMultiple ? String(item.minMultiple) : '');
    setPqFormMaxMultiple(item.maxMultiple ? String(item.maxMultiple) : '');
    setPqDialogOpen(true);
  };

  const handlePqSave = async () => {
    if (!pqFormDesc.trim()) {
      toast.error('请输入类型描述');
      return;
    }
    const discountNum = parseFloat(pqFormDiscount) / 100;
    if (isNaN(discountNum)) {
      toast.error('请输入有效的折扣值');
      return;
    }
    const minMultiple = pqFormMinMultiple.trim() ? parseFloat(pqFormMinMultiple) : 0;
    const maxMultiple = pqFormMaxMultiple.trim() ? parseFloat(pqFormMaxMultiple) : 0;
    if (pqFormMinMultiple.trim() && isNaN(minMultiple)) {
      toast.error('请输入有效的最小倍数');
      return;
    }
    if (pqFormMaxMultiple.trim() && isNaN(maxMultiple)) {
      toast.error('请输入有效的最大倍数');
      return;
    }
    setPqSaving(true);
    try {
      if (pqEditing) {
        await updatePurchaseQuantity(pqEditing.id, {
          typeDesc: pqFormDesc.trim(),
          discount: discountNum,
          minMultiple,
          maxMultiple,
        });
        toast.success('更新成功');
      } else {
        await createPurchaseQuantity({
          typeDesc: pqFormDesc.trim(),
          discount: discountNum,
          minMultiple,
          maxMultiple,
        });
        toast.success('创建成功');
      }
      setPqDialogOpen(false);
      fetchPqData(pqPage);
    } catch {
      toast.error(pqEditing ? '更新失败' : '创建失败');
    } finally {
      setPqSaving(false);
    }
  };

  // === Import Handlers ===
  const downloadPqTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['类型描述', '折扣值', '最小倍数', '最大倍数'],
      ['类型A', 0.95, 1, 10],
      ['类型B', 0.90, 0, 0],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, '拿货量配置');
    XLSX.writeFile(wb, '拿货量配置导入模板.xlsx');
  };

  const handlePqImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setPqImporting(true);
    setPqImportStats(null);
    setPqImportErrors([]);
    try {
      const data = new Uint8Array(await file.arrayBuffer());
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        toast.error('Excel 文件中没有工作表');
        setPqImporting(false);
        return;
      }
      const sheet = workbook.Sheets[sheetName];
      const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (rows.length < 2) {
        toast.error('Excel 文件中没有数据行');
        setPqImporting(false);
        return;
      }

      const headerRow = (rows[0] || []).map((h: string) => String(h ?? '').trim());
      const descIdx = headerRow.indexOf('类型描述');
      const discountIdx = headerRow.indexOf('折扣值');
      const minIdx = headerRow.indexOf('最小倍数');
      const maxIdx = headerRow.indexOf('最大倍数');

      if (descIdx < 0 || discountIdx < 0) {
        toast.error('模板缺少必要列：类型描述、折扣值');
        setPqImporting(false);
        return;
      }

      const parsedRows = rows.slice(1).map((row: string[]) => ({
        typeDesc: String(row[descIdx] ?? '').trim(),
        discount: String(row[discountIdx] ?? '').trim(),
        minMultiple: minIdx >= 0 ? String(row[minIdx] ?? '').trim() : '',
        maxMultiple: maxIdx >= 0 ? String(row[maxIdx] ?? '').trim() : '',
      }));

      const result = await importPurchaseQuantities(parsedRows);
      setPqImportStats({ imported: result.imported, updated: result.updated, failed: result.failed });
      setPqImportErrors(result.errors);
      if (result.imported + result.updated > 0) {
        toast.success(`导入完成：新增 ${result.imported} 条，更新 ${result.updated} 条`);
        fetchPqData(pqPage);
      }
      if (result.failed > 0 && result.imported + result.updated === 0) {
        toast.error('导入失败，请检查错误详情');
      }
    } catch {
      toast.error('文件解析或导入失败');
    } finally {
      setPqImporting(false);
    }
  };

  const handlePqImportDialogClose = () => {
    setPqImportDialogOpen(false);
    setPqImportStats(null);
    setPqImportErrors([]);
  };

  const handlePqDelete = async () => {
    if (!pqDeleteTarget) return;
    try {
      await deletePurchaseQuantity(pqDeleteTarget.id);
      toast.success('删除成功');
      setPqDeleteTarget(null);
      const maxPage = Math.max(1, Math.ceil((pqTotal - 1) / PAGE_SIZE));
      if (pqPage > maxPage) {
        setPqPage(maxPage);
      } else {
        fetchPqData(pqPage);
      }
    } catch {
      toast.error('删除失败');
      setPqDeleteTarget(null);
    }
  };

  // === Logistics Cost Handlers ===
  const openLcCreate = () => {
    setLcEditing(null);
    setLcFormType(LOGISTICS_COST_TYPES[0]);
    setLcFormDiscount('');
    setLcDialogOpen(true);
  };

  const openLcEdit = (item: LogisticsCostItem) => {
    setLcEditing(item);
    setLcFormType(item.costType);
    setLcFormDiscount(toDiscountInputValue(item.discount));
    setLcDialogOpen(true);
  };

  const handleLcSave = async () => {
    if (!lcFormType) {
      toast.error('请选择物流类型');
      return;
    }
    const discountNum = parseFloat(lcFormDiscount) / 100;
    if (isNaN(discountNum)) {
      toast.error('请输入有效的折扣值');
      return;
    }
    setLcSaving(true);
    try {
      if (lcEditing) {
        await updateLogisticsCost(lcEditing.id, {
          costType: lcFormType,
          discount: discountNum,
        });
        toast.success('更新成功');
      } else {
        await createLogisticsCost({
          costType: lcFormType,
          discount: discountNum,
        });
        toast.success('创建成功');
      }
      setLcDialogOpen(false);
      fetchLcData(lcPage);
    } catch {
      toast.error(lcEditing ? '更新失败' : '创建失败');
    } finally {
      setLcSaving(false);
    }
  };

  const handleLcDelete = async () => {
    if (!lcDeleteTarget) return;
    try {
      await deleteLogisticsCost(lcDeleteTarget.id);
      toast.success('删除成功');
      setLcDeleteTarget(null);
      const maxPage = Math.max(1, Math.ceil((lcTotal - 1) / PAGE_SIZE));
      if (lcPage > maxPage) {
        setLcPage(maxPage);
      } else {
        fetchLcData(lcPage);
      }
    } catch {
      toast.error('删除失败');
      setLcDeleteTarget(null);
    }
  };

  const pqTotalPages = Math.max(1, Math.ceil(pqTotal / PAGE_SIZE));
  const lcTotalPages = Math.max(1, Math.ceil(lcTotal / PAGE_SIZE));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-lg font-semibold text-foreground">
          拿货量与物流成本配置
        </h1>
      </div>

      <Tabs defaultValue="purchase-quantity" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="rounded-none bg-transparent border-b border-border h-auto p-0 gap-0 w-full justify-start px-6">
          <TabsTrigger
            value="purchase-quantity"
            className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm font-medium"
          >
            拿货量配置
          </TabsTrigger>
          <TabsTrigger
            value="logistics-cost"
            className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm font-medium"
          >
            物流成本
          </TabsTrigger>
        </TabsList>

        {/* ========== Purchase Quantity Tab ========== */}
        <TabsContent value="purchase-quantity" className="flex-1 flex flex-col overflow-hidden mt-0 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">
              共 {pqTotal} 条记录
            </span>
            <SuperAdminOnly>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadPqTemplate}
                  className="gap-1.5"
                >
                  <Download className="size-4" />
                  下载模板
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPqImportDialogOpen(true)}
                  className="gap-1.5"
                >
                  <Upload className="size-4" />
                  批量导入
                </Button>
                <Button
                  size="sm"
                  onClick={openPqCreate}
                  className="gap-1.5"
                >
                  <Plus className="size-4" />
                  新建类型
                </Button>
              </div>
            </SuperAdminOnly>
          </div>

          <div className="flex-1 overflow-auto">
            {pqLoading ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                加载中...
              </div>
            ) : pqItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                暂无数据
              </div>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border border-border">
                    <th className="border border-border bg-accent/50 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      类型描述
                    </th>
                    <th className="border border-border bg-accent/50 px-4 py-2.5 text-right text-xs font-medium text-muted-foreground w-[120px]">
                      折扣值
                    </th>
                    <th className="border border-border bg-accent/50 px-4 py-2.5 text-right text-xs font-medium text-muted-foreground w-[100px]">
                      最小倍数
                    </th>
                    <th className="border border-border bg-accent/50 px-4 py-2.5 text-right text-xs font-medium text-muted-foreground w-[100px]">
                      最大倍数
                    </th>
                    <th className="border border-border bg-accent/50 px-4 py-2.5 text-center text-xs font-medium text-muted-foreground w-[120px]">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pqItems.map((item: PurchaseQuantityItem) => (
                    <tr
                      key={item.id}
                      className="border-x border-b border-border hover:bg-accent/30 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-foreground">{item.typeDesc}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-foreground">
                        {formatDiscount(item.discount)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-foreground">
                        {item.minMultiple || '-'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-foreground">
                        {item.maxMultiple || '-'}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <SuperAdminOnly>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openPqEdit(item)}
                              className="h-7 px-2 text-muted-foreground hover:text-foreground"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                          </SuperAdminOnly>
                          <SuperAdminOnly>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPqDeleteTarget(item)}
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

          {pqTotal > 0 && (
            <div className="flex items-center justify-between border-t border-border pt-3 mt-3">
              <span className="text-xs text-muted-foreground">
                共 {pqTotal} 条记录，第 {pqPage}/{pqTotalPages} 页
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pqPage <= 1}
                  onClick={() => setPqPage((p: number) => p - 1)}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pqPage >= pqTotalPages}
                  onClick={() => setPqPage((p: number) => p + 1)}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ========== Logistics Cost Tab ========== */}
        <TabsContent value="logistics-cost" className="flex-1 flex flex-col overflow-hidden mt-0 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">
              共 {lcTotal} 条记录
            </span>
            <SuperAdminOnly>
              <Button
                size="sm"
                onClick={openLcCreate}
                className="gap-1.5"
              >
                <Plus className="size-4" />
                新建物流类型
              </Button>
            </SuperAdminOnly>
          </div>

          <div className="flex-1 overflow-auto">
            {lcLoading ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                加载中...
              </div>
            ) : lcItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                暂无数据
              </div>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border border-border">
                    <th className="border border-border bg-accent/50 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      物流类型
                    </th>
                    <th className="border border-border bg-accent/50 px-4 py-2.5 text-right text-xs font-medium text-muted-foreground w-[140px]">
                      折扣值
                    </th>
                    <th className="border border-border bg-accent/50 px-4 py-2.5 text-center text-xs font-medium text-muted-foreground w-[120px]">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lcItems.map((item: LogisticsCostItem) => (
                    <tr
                      key={item.id}
                      className="border-x border-b border-border hover:bg-accent/30 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-foreground">{item.costType}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-foreground">
                        {formatDiscount(item.discount)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <SuperAdminOnly>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openLcEdit(item)}
                              className="h-7 px-2 text-muted-foreground hover:text-foreground"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                          </SuperAdminOnly>
                          <SuperAdminOnly>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setLcDeleteTarget(item)}
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

          {lcTotal > 0 && (
            <div className="flex items-center justify-between border-t border-border pt-3 mt-3">
              <span className="text-xs text-muted-foreground">
                共 {lcTotal} 条记录，第 {lcPage}/{lcTotalPages} 页
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={lcPage <= 1}
                  onClick={() => setLcPage((p: number) => p - 1)}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={lcPage >= lcTotalPages}
                  onClick={() => setLcPage((p: number) => p + 1)}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ========== Purchase Quantity Dialog ========== */}
      <Dialog open={pqDialogOpen} onOpenChange={setPqDialogOpen}>
        <DialogContent className="rounded-sm max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {pqEditing ? '编辑类型' : '新建类型'}
            </DialogTitle>
            <DialogDescription>
              {pqEditing ? '修改拿货量类型配置' : '添加新的拿货量类型及折扣'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                类型描述
              </label>
              <Input
                value={pqFormDesc}
                onChange={(e) => setPqFormDesc(e.target.value)}
                placeholder="请输入类型描述"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                折扣值
              </label>
              <Input
                type="text"
                inputMode="decimal"
                value={pqFormDiscount}
                onChange={(e) => setPqFormDiscount(e.target.value)}
                placeholder="请输入百分比，如 95.5 表示 95.5%"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  最小倍数
                </label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={pqFormMinMultiple}
                  onChange={(e) => setPqFormMinMultiple(e.target.value)}
                  placeholder="可为空，如 1"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  最大倍数
                </label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={pqFormMaxMultiple}
                  onChange={(e) => setPqFormMaxMultiple(e.target.value)}
                  placeholder="可为空，如 10"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPqDialogOpen(false)}
              disabled={pqSaving}
            >
              取消
            </Button>
            <Button
              onClick={handlePqSave}
              disabled={pqSaving}
            >
              {pqSaving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== Logistics Cost Dialog ========== */}
      <Dialog open={lcDialogOpen} onOpenChange={setLcDialogOpen}>
        <DialogContent className="rounded-sm max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {lcEditing ? '编辑物流类型' : '新建物流类型'}
            </DialogTitle>
            <DialogDescription>
              {lcEditing ? '修改物流成本类型配置' : '添加新的物流类型及折扣'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                物流类型
              </label>
              <Select value={lcFormType} onValueChange={setLcFormType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="请选择物流类型" />
                </SelectTrigger>
                <SelectContent>
                  {LOGISTICS_COST_TYPES.map((type: string) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                折扣值
              </label>
              <Input
                type="text"
                inputMode="decimal"
                value={lcFormDiscount}
                onChange={(e) => setLcFormDiscount(e.target.value)}
                placeholder="请输入百分比，如 95.5 表示 95.5%"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLcDialogOpen(false)}
              disabled={lcSaving}
            >
              取消
            </Button>
            <Button
              onClick={handleLcSave}
              disabled={lcSaving}
            >
              {lcSaving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== Import Dialog: Purchase Quantity ========== */}
      <Dialog open={pqImportDialogOpen} onOpenChange={(open: boolean) => { if (!open) handlePqImportDialogClose(); else setPqImportDialogOpen(true); }}>
        <DialogContent className="rounded-sm max-w-lg">
          <DialogHeader>
            <DialogTitle>批量导入拿货量配置</DialogTitle>
            <DialogDescription>
              请选择 Excel 文件（.xlsx），已存在的类型描述将被更新
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-sm p-8">
              {pqImporting ? (
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
                      onChange={handlePqImportFile}
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

            {pqImportStats && (
              <div className="space-y-2">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-foreground">
                    新增：
                    <span className="font-mono font-medium text-emerald-600">
                      {pqImportStats.imported}
                    </span>{' '}
                    条
                  </span>
                  <span className="text-foreground">
                    更新：
                    <span className="font-mono font-medium text-blue-600">
                      {pqImportStats.updated}
                    </span>{' '}
                    条
                  </span>
                  {pqImportStats.failed > 0 && (
                    <span className="text-foreground">
                      失败：
                      <span className="font-mono font-medium text-destructive">
                        {pqImportStats.failed}
                      </span>{' '}
                      条
                    </span>
                  )}
                </div>
                {pqImportErrors.length > 0 && (
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
                        {pqImportErrors.map(
                          (err: ImportPurchaseQuantityError, idx: number) => (
                            <tr
                              key={idx}
                              className="border-x border-b border-border"
                            >
                              <td className="px-3 py-1.5 font-mono text-muted-foreground">
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
              onClick={handlePqImportDialogClose}
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== Delete Confirmation: Purchase Quantity ========== */}
      <AlertDialog
        open={!!pqDeleteTarget}
        onOpenChange={(open: boolean) => { if (!open) setPqDeleteTarget(null); }}
      >
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除类型「{pqDeleteTarget?.typeDesc}」吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePqDelete}
              className="rounded-sm bg-destructive text-white hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ========== Delete Confirmation: Logistics Cost ========== */}
      <AlertDialog
        open={!!lcDeleteTarget}
        onOpenChange={(open: boolean) => { if (!open) setLcDeleteTarget(null); }}
      >
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除物流类型「{lcDeleteTarget?.costType}」吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLcDelete}
              className="rounded-sm bg-destructive text-white hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PurchaseLogistics;
