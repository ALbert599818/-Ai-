import { useState, useCallback, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/lark-shim/logger';
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
  getOtherDiscountList,
  createOtherDiscount,
  updateOtherDiscount,
  deleteOtherDiscount,
} from '@client/src/api/other-discount';
import type { OtherDiscountItem } from '@shared/other-discount';
import CanEdit from '@client/src/components/CanEdit';

const QUICK_TYPES = ['保费', '固定汇率风险准备金', '售后准备金率'];
const PAGE_SIZE = 20;

interface FormState {
  discountType: string;
  discount: string;
}

const OtherDiscount = () => {
  const [items, setItems] = useState<OtherDiscountItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OtherDiscountItem | null>(null);
  const [formState, setFormState] = useState<FormState>({ discountType: '', discount: '' });
  const [submitting, setSubmitting] = useState(false);

  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<OtherDiscountItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getOtherDiscountList({
        keyword: keyword || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch {
      toast.error('获取列表失败');
    } finally {
      setLoading(false);
    }
  }, [keyword, page]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleSearch = () => {
    setPage(1);
    fetchList();
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormState({ discountType: '', discount: '' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: OtherDiscountItem) => {
    setEditingItem(item);
    setFormState({
      discountType: item.discountType,
      discount: toDiscountInputValue(item.discount),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formState.discountType.trim()) {
      toast.error('请输入折扣类型');
      return;
    }
    if (!formState.discount.trim() || isNaN(Number(formState.discount))) {
      toast.error('请输入有效的折扣值');
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        discountType: formState.discountType.trim(),
        discount: Number(formState.discount) / 100,
      };
      if (editingItem) {
        await updateOtherDiscount(editingItem.id, data);
        toast.success('更新成功');
      } else {
        await createOtherDiscount(data);
        toast.success('创建成功');
      }
      setDialogOpen(false);
      fetchList();
    } catch {
      toast.error(editingItem ? '更新失败' : '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (item: OtherDiscountItem) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      await deleteOtherDiscount(deletingItem.id);
      toast.success('删除成功');
      setDeleteDialogOpen(false);
      fetchList();
    } catch {
      toast.error('删除失败');
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-foreground">
            其它折扣管理
          </h1>
          <div className="relative w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="搜索折扣类型..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>
        </div>
        <CanEdit>
          <Button onClick={handleOpenCreate} className="gap-1.5">
            <Plus className="size-4" />
            新建折扣类型
          </Button>
        </CanEdit>
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
                  折扣类型
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
              {items.map((item: OtherDiscountItem) => (
                <tr
                  key={item.id}
                  className="border-x border-b border-border hover:bg-accent/30 transition-colors"
                >
                  <td className="px-4 py-2.5 text-foreground">{item.discountType}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-foreground">
                    {formatDiscount(item.discount)}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <CanEdit>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(item)}
                          className="h-7 px-2 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      </CanEdit>
                      <CanEdit>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDelete(item)}
                          className="h-7 px-2 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </CanEdit>
                    </div>
                  </td>
                </tr>
              ))}
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
              {editingItem ? '编辑折扣类型' : '新建折扣类型'}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? '修改折扣类型及其折扣值' : '创建新的折扣类型并设置折扣值'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                折扣类型
              </label>
              <Input
                placeholder="请输入折扣类型名称"
                value={formState.discountType}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, discountType: e.target.value }))
                }
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {QUICK_TYPES.map((type: string) => (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFormState((prev) => ({ ...prev, discountType: type }))
                    }
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                折扣值
              </label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="请输入百分比，如 95.5 表示 95.5%"
                value={formState.discount}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, discount: e.target.value }))
                }
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除折扣类型「{deletingItem?.discountType}」吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
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

export default OtherDiscount;
