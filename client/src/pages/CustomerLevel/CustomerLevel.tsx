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
  getProductCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
} from '@client/src/api/product-category';
import type { ProductCategoryItem } from '@shared/product-category';
import SuperAdminOnly from '@client/src/components/SuperAdminOnly';

const GRADE_OPTIONS = ['S', 'A', 'B', 'C', 'D', '无'];

function getGradeBadgeStyle(grade: string): { bg: string; text: string } {
  switch (grade) {
    case 'S':
      return { bg: 'hsl(40, 85%, 55%)', text: '#fff' };
    case 'A':
      return { bg: 'hsl(210, 70%, 55%)', text: '#fff' };
    case 'B':
      return { bg: 'hsl(150, 55%, 45%)', text: '#fff' };
    case 'C':
      return { bg: 'hsl(260, 55%, 60%)', text: '#fff' };
    case 'D':
      return { bg: 'hsl(20, 70%, 55%)', text: '#fff' };
    default:
      return { bg: 'hsl(220, 10%, 60%)', text: '#fff' };
  }
}

export default function ProductCategoryPage() {
  const [items, setItems] = useState<ProductCategoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductCategoryItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formGrade, setFormGrade] = useState('无');
  const [formSortOrder, setFormSortOrder] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ProductCategoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getProductCategories();
      setItems(result);
    } catch {
      toast.error('获取品类列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openCreate = () => {
    setEditingItem(null);
    setFormName('');
    setFormGrade('无');
    setFormSortOrder('');
    setDialogOpen(true);
  };

  const openEdit = (item: ProductCategoryItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormGrade(item.defaultGrade || '无');
    setFormSortOrder(String(item.sortOrder ?? ''));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('请输入品类名称');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        defaultGrade: formGrade,
        sortOrder: formSortOrder ? parseInt(formSortOrder, 10) : undefined,
      };
      if (editingItem) {
        await updateProductCategory(editingItem.id, payload);
        toast.success('更新成功');
      } else {
        await createProductCategory(payload);
        toast.success('创建成功');
      }
      setDialogOpen(false);
      fetchList();
    } catch (error: unknown) {
      const resp = (error as { response?: { data?: { message?: string } } })?.response;
      toast.error(resp?.data?.message || '操作失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProductCategory(deleteTarget.id);
      toast.success('删除成功');
      setDeleteTarget(null);
      fetchList();
    } catch (error: unknown) {
      const resp = (error as { response?: { data?: { message?: string } } })?.response;
      toast.error(resp?.data?.message || '删除失败');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-foreground">
            品类等级管理
          </h1>
          <span className="text-xs text-muted-foreground">
            统一维护系统中的品类及默认等级，其他模块自动同步
          </span>
        </div>
        <SuperAdminOnly>
          <Button onClick={openCreate} className="gap-1.5">
            <Plus className="size-4" />
            新增品类
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
            暂无品类数据
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {items.map((item) => {
              const badge = getGradeBadgeStyle(item.defaultGrade);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between border border-border rounded-sm p-4 bg-background hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={item.defaultGrade || '无'}
                      onValueChange={async (v) => {
                        try {
                          await updateProductCategory(item.id, { defaultGrade: v });
                          toast.success('等级已更新');
                          fetchList();
                        } catch {
                          toast.error('更新失败');
                        }
                      }}
                    >
                      <SelectTrigger className="w-[100px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADE_OPTIONS.map((g) => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <SuperAdminOnly>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(item)}
                        className="h-7 px-2 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-sm max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? '编辑' : '新增'}品类</DialogTitle>
            <DialogDescription>
              品类名称将作为系统中所有品类下拉的统一来源
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">品类名称 *</label>
              <Input
                placeholder="例如：音频-耳机"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">默认等级</label>
              <Select value={formGrade} onValueChange={setFormGrade}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_OPTIONS.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">排序（可选，数字越小越靠前）</label>
              <Input
                type="number"
                placeholder="例如：1"
                value={formSortOrder}
                onChange={(e) => setFormSortOrder(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
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
              确定要删除品类「{deleteTarget?.name}」吗？
              只有当该品类未被产品、毛利率目标、客户等级等引用时才能删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
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
