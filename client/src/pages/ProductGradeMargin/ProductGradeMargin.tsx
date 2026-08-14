import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@client/src/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  getProductGradeMarginList,
  createProductGradeMargin,
  updateProductGradeMargin,
  deleteProductGradeMargin,
} from '@client/src/api/product-grade-margin';
import type { ProductGradeMarginItem } from '@shared/product-grade-margin';
import SuperAdminOnly from '@client/src/components/SuperAdminOnly';
import ProductGradeMarginImport from './ProductGradeMarginImport';

const PAGE_SIZE = 20;

const PRODUCT_GRADE_OPTIONS = ['S', 'A', 'B', 'C', 'D'];

function formatPercent(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return '-';
  return `${Number(num.toFixed(2))}%`;
}

export default function ProductGradeMarginPage() {
  const [items, setItems] = useState<ProductGradeMarginItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] =
    useState<ProductGradeMarginItem | null>(null);
  const [formCategory, setFormCategory] = useState('');
  const [formProductGrade, setFormProductGrade] = useState('');
  const [formTargetMargin, setFormTargetMargin] = useState('');
  const [formRedline, setFormRedline] = useState('');
  const [formSalesRatio, setFormSalesRatio] = useState('');
  const [
    formMarginContribution,
    setFormMarginContribution,
  ] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] =
    useState<ProductGradeMarginItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getProductGradeMarginList({
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

  const handleSearchKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Enter') handleSearch();
  };

  const resetForm = () => {
    setFormCategory('');
    setFormProductGrade('');
    setFormTargetMargin('');
    setFormRedline('0.8');
    setFormSalesRatio('');
    setFormMarginContribution('');
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (item: ProductGradeMarginItem) => {
    setEditingItem(item);
    setFormCategory(item.category);
    setFormProductGrade(item.productGrade);
    setFormTargetMargin(item.targetMargin);
    setFormRedline(item.marginRedline);
    setFormSalesRatio(item.salesRatio);
    setFormMarginContribution(item.marginContribution);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const category = formCategory.trim();
    if (!category) {
      toast.error('请输入品类');
      return;
    }
    if (!formProductGrade) {
      toast.error('请选择产品等级');
      return;
    }

    const fields = [
      { label: '目标毛利率', value: formTargetMargin },
      { label: '毛利率红线', value: formRedline },
      { label: '销售占比', value: formSalesRatio },
      {
        label: '毛利贡献率',
        value: formMarginContribution,
      },
    ];

    for (const field of fields) {
      const num = parseFloat(field.value);
      if (isNaN(num)) {
        toast.error(`请输入有效的${field.label}`);
        return;
      }
    }

    const payload = {
      category,
      productGrade: formProductGrade,
      targetMargin: String(parseFloat(formTargetMargin)),
      marginRedline: String(parseFloat(formRedline)),
      salesRatio: String(parseFloat(formSalesRatio)),
      marginContribution: String(
        parseFloat(formMarginContribution),
      ),
    };

    setSaving(true);
    try {
      if (editingItem) {
        await updateProductGradeMargin(
          editingItem.id,
          payload,
        );
        toast.success('更新成功');
      } else {
        await createProductGradeMargin(payload);
        toast.success('创建成功');
      }
      setDialogOpen(false);
      fetchList();
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'response' in error
      ) {
        const resp = (
          error as {
            response?: { data?: { message?: string } };
          }
        ).response;
        toast.error(resp?.data?.message || '操作失败');
      } else {
        toast.error('操作失败');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProductGradeMargin(deleteTarget.id);
      toast.success('删除成功');
      setDeleteTarget(null);
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
            产品品级及基本毛利率
          </h1>
          <div className="relative w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="搜索品类或产品等级..."
              value={keyword}
              onChange={(
                e: React.ChangeEvent<HTMLInputElement>,
              ) => setKeyword(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ProductGradeMarginImport
            open={importDialogOpen}
            onOpenChange={setImportDialogOpen}
            onSuccess={fetchList}
          />
          <SuperAdminOnly>
            <Button
              onClick={openCreateDialog}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              新建记录
            </Button>
          </SuperAdminOnly>
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
                  品类
                </th>
                <th className="border border-border bg-accent/50 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  产品等级
                </th>
                <th className="border border-border bg-accent/50 px-4 py-2.5 text-right text-xs font-medium text-muted-foreground w-[120px]">
                  目标毛利率
                </th>
                <th className="border border-border bg-accent/50 px-4 py-2.5 text-right text-xs font-medium text-muted-foreground w-[120px]">
                  毛利率红线
                </th>
                <th className="border border-border bg-accent/50 px-4 py-2.5 text-right text-xs font-medium text-muted-foreground w-[120px]">
                  销售占比
                </th>
                <th className="border border-border bg-accent/50 px-4 py-2.5 text-right text-xs font-medium text-muted-foreground w-[120px]">
                  毛利贡献率
                </th>
                <th className="border border-border bg-accent/50 px-4 py-2.5 text-center text-xs font-medium text-muted-foreground w-[100px]">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map(
                (item: ProductGradeMarginItem) => (
                  <tr
                    key={item.id}
                    className="border-x border-b border-border hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-foreground">
                      {item.category}
                    </td>
                    <td className="px-4 py-2.5 text-foreground">
                      {item.productGrade}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-foreground">
                      {formatPercent(item.targetMargin)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-foreground">
                      {formatPercent(item.marginRedline)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-foreground">
                      {formatPercent(item.salesRatio)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-foreground">
                      {formatPercent(
                        item.marginContribution,
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <SuperAdminOnly>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              openEditDialog(item)
                            }
                            className="h-7 px-2 text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        </SuperAdminOnly>
                        <SuperAdminOnly>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setDeleteTarget(item)
                            }
                            className="h-7 px-2 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </SuperAdminOnly>
                      </div>
                    </td>
                  </tr>
                ),
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
              {editingItem ? '编辑记录' : '新建记录'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? '修改产品品级及基本毛利率配置'
                : '新增产品品级及基本毛利率配置'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                品类
              </label>
              <Input
                placeholder="请输入品类名称"
                value={formCategory}
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement>,
                ) => setFormCategory(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                产品等级
              </label>
              <Select
                value={formProductGrade}
                onValueChange={setFormProductGrade}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择产品等级" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_GRADE_OPTIONS.map(
                    (grade: string) => (
                      <SelectItem
                        key={grade}
                        value={grade}
                      >
                        {grade}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  目标毛利率
                </label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="请输入百分比数值"
                  value={formTargetMargin}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement>,
                  ) =>
                    setFormTargetMargin(e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  毛利率红线
                </label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="请输入百分比数值"
                  value={formRedline}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement>,
                  ) =>
                    setFormRedline(e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  销售占比
                </label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="请输入百分比数值"
                  value={formSalesRatio}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement>,
                  ) =>
                    setFormSalesRatio(e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  毛利贡献率
                </label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="请输入百分比数值"
                  value={formMarginContribution}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement>,
                  ) =>
                    setFormMarginContribution(
                      e.target.value,
                    )
                  }
                />
              </div>
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

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open: boolean) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{deleteTarget?.category} -{' '}
              {deleteTarget?.productGrade}
              」的配置吗？此操作不可撤销。
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
}
