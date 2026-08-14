import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/lark-shim/logger';
import { formatDiscount } from '@client/src/utils/format';
const toDiscountInputValue = (value: number | string): string => formatDiscount(value).replace('%', '');
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getCreditTermList,
  createCreditTerm,
  updateCreditTerm,
  deleteCreditTerm,
} from '@client/src/api/credit-term';
import type { CreditTermItem } from '@shared/credit-term';
import { Button } from '@/components/ui/button';
import CanEdit from '@client/src/components/CanEdit';

const CATEGORY_OPTIONS = [
  { value: '无订金（或小于10%的订金）', label: '无订金（或小于10%的订金）' },
  { value: '有订金（10-30%）', label: '有订金（10-30%）' },
];

const PAGE_SIZE = 20;

const CreditTerm: React.FC = () => {
  const [items, setItems] = useState<CreditTermItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<CreditTermItem | null>(null);
  const [formCategory, setFormCategory] = useState<string>('');
  const [formSubItem, setFormSubItem] = useState<string>('');
  const [formDiscount, setFormDiscount] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Delete dialog state
  const [deleteItem, setDeleteItem] = useState<CreditTermItem | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCreditTermList({
        category: categoryFilter || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch {
      toast.error('获取信用条件列表失败');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = (): void => {
    setEditingItem(null);
    setFormCategory('');
    setFormSubItem('');
    setFormDiscount('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: CreditTermItem): void => {
    setEditingItem(item);
    setFormCategory(item.category);
    setFormSubItem(item.subItem);
    setFormDiscount(toDiscountInputValue(item.discount));
    setDialogOpen(true);
  };

  const handleSubmit = async (): Promise<void> => {
    if (!formCategory) {
      toast.error('请选择信用条件类别');
      return;
    }
    if (!formSubItem.trim()) {
      toast.error('请输入信用条件子项');
      return;
    }
    const discountNum = parseFloat(formDiscount) / 100;
    if (isNaN(discountNum)) {
      toast.error('请输入有效的折扣值');
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        await updateCreditTerm(editingItem.id, {
          category: formCategory,
          subItem: formSubItem.trim(),
          discount: discountNum,
        });
        toast.success('更新成功');
      } else {
        await createCreditTerm({
          category: formCategory,
          subItem: formSubItem.trim(),
          discount: discountNum,
        });
        toast.success('创建成功');
      }
      setDialogOpen(false);
      fetchData();
    } catch {
      toast.error(editingItem ? '更新失败' : '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await deleteCreditTerm(deleteItem.id);
      toast.success('删除成功');
      setDeleteItem(null);
      fetchData();
    } catch {
      toast.error('删除失败');
    } finally {
      setDeleting(false);
    }
  };

  const handleCategoryFilterChange = (value: string): void => {
    if (value === '__all__') {
      setCategoryFilter('');
    } else {
      setCategoryFilter(value);
    }
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Group items by category for visual grouping
  const groupedItems: { category: string; rows: CreditTermItem[] }[] = [];
  let currentGroup: { category: string; rows: CreditTermItem[] } | null = null;
  for (const item of items) {
    if (!currentGroup || currentGroup.category !== item.category) {
      currentGroup = { category: item.category, rows: [item] };
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
            信用条件管理
          </h1>
          <Select
            value={categoryFilter || '__all__'}
            onValueChange={handleCategoryFilterChange}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="全部类别" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">全部</SelectItem>
              {CATEGORY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <CanEdit>
          <Button onClick={handleOpenCreate} className="gap-1.5">
            <Plus className="size-4" />
            新建信用条件
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
                  信用条件类别
                </th>
                <th className="border border-border bg-accent/50 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  信用条件子项
                </th>
                <th className="border border-border bg-accent/50 px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
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
                        <span className="font-medium">{group.category}</span>
                      ) : (
                        <span className="text-muted-foreground">
                          {group.category}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-foreground">
                      {item.subItem}
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
                            onClick={() => setDeleteItem(item)}
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
              {editingItem ? '编辑信用条件' : '新建信用条件'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? '修改信用条件的类别、子项和折扣值'
                : '添加新的信用条件及折扣系数'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                信用条件类别
              </label>
              <Select
                value={formCategory}
                onValueChange={setFormCategory}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="请选择类别" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                信用条件子项
              </label>
              <Input
                value={formSubItem}
                onChange={(e) => setFormSubItem(e.target.value)}
                placeholder="请输入子项名称"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                折扣值
              </label>
              <Input
                type="text"
                inputMode="decimal"
                value={formDiscount}
                onChange={(e) => setFormDiscount(e.target.value)}
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
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{deleteItem?.subItem}」吗？此操作不可撤销。
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

export default CreditTerm;
