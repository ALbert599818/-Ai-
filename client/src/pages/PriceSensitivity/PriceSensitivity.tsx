import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import PriceSensitivityImport from './PriceSensitivityImport';
import { Button } from '@client/src/components/ui/button';
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
import { Input } from '@client/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { toast } from 'sonner';
import { logger } from '@/lib/lark-shim/logger';
import { formatDiscount } from '@client/src/utils/format';
const toDiscountInputValue = (value: number | string): string => formatDiscount(value).replace('%', '');
import type { PriceSensitivityItem } from '@shared/price-sensitivity';
import {
  getPriceSensitivityList,
  createPriceSensitivity,
  updatePriceSensitivity,
  deletePriceSensitivity,
} from '@client/src/api/price-sensitivity';
import { getChannelTypeList } from '@client/src/api/channel-type';
import CanEdit from '@client/src/components/CanEdit';

const REGION_OPTIONS = [
  { value: '欧美', label: '欧美' },
  { value: '澳新日韩', label: '澳新日韩' },
  { value: '拉美', label: '拉美' },
  { value: '东南亚', label: '东南亚' },
  { value: '其他地区', label: '其他地区' },
];

const FALLBACK_CHANNEL_TYPE_OPTIONS = [
  { value: 'B2B', label: 'B2B' },
  { value: 'B2C', label: 'B2C' },
  { value: '线下', label: '线下' },
  { value: '电商平台', label: '电商平台' },
  { value: '其他', label: '其他' },
];

const PAGE_SIZE = 20;

type FormState = {
  region: string;
  channelType: string;
  discount: string;
};

const EMPTY_FORM: FormState = { region: '', channelType: '', discount: '' };

type GroupedItem = {
  region: string;
  rows: PriceSensitivityItem[];
};

const PriceSensitivity = () => {
  const [items, setItems] = useState<PriceSensitivityItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<PriceSensitivityItem | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<PriceSensitivityItem | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Import dialog state
  const [importOpen, setImportOpen] = useState<boolean>(false);

  // Channel type options
  const [channelTypeOptions, setChannelTypeOptions] = useState(FALLBACK_CHANNEL_TYPE_OPTIONS);

  // Load channel types from API
  useEffect(() => {
    const loadChannelTypes = async () => {
      try {
        const data = await getChannelTypeList({ pageSize: 100 });
        if (data.items.length > 0) {
          setChannelTypeOptions(
            data.items.map((item: { id: string; name: string }) => ({
              value: item.name,
              label: item.name,
            })),
          );
        }
      } catch {
        // Fall back to hardcoded options
      }
    };
    loadChannelTypes();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPriceSensitivityList({
        region: regionFilter || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setItems(data.items);
      setTotal(data.total);
    } catch (error) {
      logger.error('Failed to fetch price sensitivity list', error);
      toast.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  }, [regionFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleFilterChange = (value: string): void => {
    setRegionFilter(value === '__all__' ? '' : value);
    setPage(1);
  };

  const openCreateDialog = (): void => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (item: PriceSensitivityItem): void => {
    setEditingItem(item);
    setForm({
      region: item.region,
      channelType: item.channelType,
      discount: toDiscountInputValue(item.discount),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (): Promise<void> => {
    if (!form.region) {
      toast.error('请选择地区');
      return;
    }
    if (!form.channelType) {
      toast.error('请选择渠道类型');
      return;
    }

    const discountNum = parseFloat(form.discount) / 100;
    if (isNaN(discountNum)) {
      toast.error('请输入有效的折扣值');
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        await updatePriceSensitivity(editingItem.id, {
          region: form.region,
          channelType: form.channelType,
          discount: discountNum,
        });
        toast.success('更新成功');
      } else {
        await createPriceSensitivity({
          region: form.region,
          channelType: form.channelType,
          discount: discountNum,
        });
        toast.success('创建成功');
      }
      setDialogOpen(false);
      fetchData();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
      if (axiosError.response?.status === 409) {
        toast.error(axiosError.response.data?.message || '该区域+渠道类型组合已存在');
      } else {
        toast.error(editingItem ? '更新失败' : '创建失败');
      }
      logger.error('Submit failed', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePriceSensitivity(deleteTarget.id);
      toast.success('删除成功');
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      logger.error('Delete failed', error);
      toast.error('删除失败');
    } finally {
      setDeleting(false);
    }
  };

  // Group items by region for visual grouping
  const groupedItems: GroupedItem[] = [];
  let currentGroup: GroupedItem | null = null;
  for (const item of items) {
    if (!currentGroup || currentGroup.region !== item.region) {
      currentGroup = { region: item.region, rows: [item] };
      groupedItems.push(currentGroup);
    } else {
      currentGroup.rows.push(item);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-foreground">
            价格敏感系数管理
          </h1>
          <Select
            value={regionFilter || '__all__'}
            onValueChange={handleFilterChange}
          >
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="全部地区" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">全部</SelectItem>
              {REGION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <PriceSensitivityImport
            open={importOpen}
            onOpenChange={setImportOpen}
            onSuccess={fetchData}
          />
          <CanEdit>
            <Button onClick={openCreateDialog} className="gap-1.5">
              <Plus className="size-4" />
              新建系数
            </Button>
          </CanEdit>
        </div>
      </div>

      {/* Table */}
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
                  地区
                </th>
                <th className="border border-border bg-accent/50 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground w-[140px]">
                  渠道类型
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
              {groupedItems.map((group) =>
                group.rows.map((item, rowIdx) => (
                  <tr
                    key={item.id}
                    className="border-x border-b border-border hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-foreground">
                      {rowIdx === 0 ? (
                        <span className="font-medium">{group.region}</span>
                      ) : (
                        <span className="text-muted-foreground">
                          {group.region}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-foreground">
                      {item.channelType}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-foreground">
                      {formatDiscount(item.discount)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <CanEdit>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(item)}
                            className="h-7 px-2 text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        </CanEdit>
                        <CanEdit>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(item)}
                            className="h-7 px-2 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </CanEdit>
                      </div>
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-sm max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? '编辑系数' : '新建系数'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? '修改价格敏感系数的地区、渠道类型和折扣值'
                : '添加新的价格敏感系数'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                地区
              </label>
              <Select
                value={form.region}
                onValueChange={(value: string) =>
                  setForm((prev: FormState) => ({ ...prev, region: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="请选择地区" />
                </SelectTrigger>
                <SelectContent>
                  {REGION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                渠道类型
              </label>
              <Select
                value={form.channelType}
                onValueChange={(value: string) =>
                  setForm((prev: FormState) => ({ ...prev, channelType: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="请选择渠道类型" />
                </SelectTrigger>
                <SelectContent>
                  {channelTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
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
                value={form.discount}
                onChange={(e) =>
                  setForm((prev: FormState) => ({ ...prev, discount: e.target.value }))
                }
                placeholder="请输入百分比，如 95.5 表示 95.5%"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? '提交中...' : editingItem ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{deleteTarget?.region} - {deleteTarget?.channelType}」的折扣系数吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PriceSensitivity;
