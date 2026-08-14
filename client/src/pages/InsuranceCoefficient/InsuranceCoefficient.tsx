import { useState, useCallback, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, FileCheck, Upload, Download } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/lark-shim/logger';

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
  getInsuranceList,
  createInsurance,
  updateInsurance,
  deleteInsurance,
} from '@client/src/api/insurance';
import type { InsuranceItem } from '@shared/insurance';
import CanEdit from '@client/src/components/CanEdit';
import InsuranceImport, { downloadTemplate } from './InsuranceImport';

const PAGE_SIZE = 20;

// 0.01 -> "1%"
const formatCoefficient = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return '-';
  return `${Number((num * 100).toFixed(2))}%`;
};

// 0.01 -> "1" (user input representing 1%)
const coefficientToInput = (value: number): string => {
  const percent = value * 100;
  return `${Number(percent.toFixed(4))}`;
};

// "1" -> 0.01 (user input 1% -> rate 0.01)
const inputToCoefficient = (input: string): number => {
  const num = parseFloat(input);
  if (Number.isNaN(num)) return 0;
  return num / 100;
};

interface FormState {
  creditCondition: string;
  coefficient: string;
}

const InsuranceCoefficient = () => {
  const [items, setItems] = useState<InsuranceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InsuranceItem | null>(null);
  const [formState, setFormState] = useState<FormState>({
    creditCondition: '',
    coefficient: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const [importOpen, setImportOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<InsuranceItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getInsuranceList({
        keyword: keyword || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch {
      toast.error('获取保费系数列表失败');
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
    setFormState({ creditCondition: '', coefficient: '' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: InsuranceItem) => {
    setEditingItem(item);
    setFormState({
      creditCondition: item.creditCondition,
      coefficient: coefficientToInput(item.coefficient),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formState.creditCondition.trim()) {
      toast.error('请输入信用条件');
      return;
    }
    if (
      !formState.coefficient.trim() ||
      isNaN(Number(formState.coefficient))
    ) {
      toast.error('请输入有效的系数值（百分比数字，如 2 表示 2%）');
      return;
    }

    setSubmitting(true);
    try {
      const coefficient = inputToCoefficient(formState.coefficient);
      const data = {
        creditCondition: formState.creditCondition.trim(),
        coefficient,
      };
      if (editingItem) {
        await updateInsurance(editingItem.id, data);
        toast.success('更新成功');
      } else {
        await createInsurance(data);
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

  const handleOpenDelete = (item: InsuranceItem) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      await deleteInsurance(deletingItem.id);
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
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileCheck className="size-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">
              保费系数
            </h1>
          </div>
          <div className="relative w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="搜索信用条件..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>
        </div>
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
          <CanEdit>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportOpen(true)}
              className="gap-1.5"
            >
              <Upload className="size-4" />
              批量导入
            </Button>
          </CanEdit>
          <CanEdit>
            <Button onClick={handleOpenCreate} className="gap-1.5">
              <Plus className="size-4" />
              新建保费系数
            </Button>
          </CanEdit>
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
                  信用条件
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
              {items.map((item: InsuranceItem) => (
                <tr
                  key={item.id}
                  className="border-x border-b border-border hover:bg-accent/30 transition-colors"
                >
                  <td className="px-4 py-2.5 text-foreground">
                    {item.creditCondition}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-foreground">
                    {formatCoefficient(item.coefficient)}
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
        <DialogContent className="rounded-sm max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? '编辑保费系数' : '新建保费系数'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? '修改信用条件及其对应系数值'
                : '创建新的信用条件并设置对应系数值'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                信用条件
              </label>
              <Input
                placeholder="请输入信用条件名称"
                value={formState.creditCondition}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    creditCondition: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                系数值（百分比）
              </label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="请输入百分比偏移，如 2 表示 2%（保存为 1.02）"
                value={formState.coefficient}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    coefficient: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                输入数字表示相对于基准的百分比偏移。例如输入 2，保存后系数为
                1.02（即 102%）。
              </p>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除信用条件「{deletingItem?.creditCondition}」的保费系数吗？此操作不可撤销。
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

      <InsuranceImport
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={fetchList}
      />
    </div>
  );
};

export default InsuranceCoefficient;
