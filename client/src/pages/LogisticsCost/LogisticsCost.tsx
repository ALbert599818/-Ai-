import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDiscount } from '@client/src/utils/format';
const toDiscountInputValue = (value: number | string): string => formatDiscount(value).replace('%', '');
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
  getLogisticsCostList,
  createLogisticsCost,
  updateLogisticsCost,
  deleteLogisticsCost,
} from '@client/src/api/logistics-cost';
import type { LogisticsCostItem } from '@shared/logistics-cost';
import SuperAdminOnly from '@client/src/components/SuperAdminOnly';

const PAGE_SIZE = 10;
const LOGISTICS_COST_TYPES = ['散货', '整柜（20尺柜）', '整柜（40尺柜）'];

const LogisticsCost = () => {
  const [items, setItems] = useState<LogisticsCostItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<LogisticsCostItem | null>(null);
  const [formType, setFormType] = useState<string>(LOGISTICS_COST_TYPES[0]);
  const [formDiscount, setFormDiscount] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<LogisticsCostItem | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLogisticsCostList({ page, pageSize: PAGE_SIZE });
      setItems(data.items);
      setTotal(data.total);
    } catch {
      toast.error('获取物流成本数据失败');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setFormType(LOGISTICS_COST_TYPES[0]);
    setFormDiscount('');
    setDialogOpen(true);
  };

  const openEdit = (item: LogisticsCostItem) => {
    setEditing(item);
    setFormType(item.costType);
    setFormDiscount(toDiscountInputValue(item.discount));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formType) {
      toast.error('请选择物流类型');
      return;
    }
    const discountNum = parseFloat(formDiscount) / 100;
    if (isNaN(discountNum)) {
      toast.error('请输入有效的折扣值');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateLogisticsCost(editing.id, {
          costType: formType,
          discount: discountNum,
        });
        toast.success('更新成功');
      } else {
        await createLogisticsCost({
          costType: formType,
          discount: discountNum,
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
      await deleteLogisticsCost(deleteTarget.id);
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

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-lg font-semibold text-foreground">
          物流成本系数录入
        </h1>
        <SuperAdminOnly>
          <Button onClick={openCreate} className="gap-1.5">
            <Plus className="size-4" />
            新建
          </Button>
        </SuperAdminOnly>
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
                  物流类型
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
              {items.map((item: LogisticsCostItem) => (
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
            <DialogTitle>{editing ? '编辑' : '新建'}物流成本系数</DialogTitle>
            <DialogDescription>
              请填写物流类型和对应的系数
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                物流类型
              </label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择物流类型" />
                </SelectTrigger>
                <SelectContent>
                  {LOGISTICS_COST_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
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
              确定要删除物流类型「{deleteTarget?.costType}」吗？此操作不可撤销。
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
    </div>
  );
};

export default LogisticsCost;
