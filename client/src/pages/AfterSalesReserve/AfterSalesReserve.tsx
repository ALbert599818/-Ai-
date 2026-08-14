import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
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
  getAfterSalesReserveList,
  createAfterSalesReserve,
  updateAfterSalesReserve,
  deleteAfterSalesReserve,
} from '@client/src/api/after-sales-reserve';
import type { AfterSalesReserveItem } from '@shared/after-sales-reserve';
import CanEdit from '@client/src/components/CanEdit';
import AfterSalesReserveImport from './AfterSalesReserveImport';

const PAGE_SIZE = 20;

function formatRate(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function formatDate(value: string): string {
  if (!value) return '-';
  return value.slice(0, 10);
}

export default function AfterSalesReservePage() {
  const [items, setItems] = useState<AfterSalesReserveItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] =
    useState<AfterSalesReserveItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formRate, setFormRate] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] =
    useState<AfterSalesReserveItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAfterSalesReserveList({
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
    setFormName('');
    setFormRate('');
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (item: AfterSalesReserveItem) => {
    setEditingItem(item);
    setFormName(item.customerShortName);
    setFormRate(String(item.rate));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const name = formName.trim();
    if (!name) {
      toast.error('请输入客户简称');
      return;
    }
    const rateNum = parseFloat(formRate);
    if (isNaN(rateNum)) {
      toast.error('请输入有效的费率');
      return;
    }

    const payload = { customerShortName: name, rate: rateNum };

    setSaving(true);
    try {
      if (editingItem) {
        await updateAfterSalesReserve(editingItem.id, payload);
        toast.success('更新成功');
      } else {
        await createAfterSalesReserve(payload);
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
      await deleteAfterSalesReserve(deleteTarget.id);
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
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-foreground">
            售后准备金率管理
          </h1>
          <div className="relative w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="搜索客户简称..."
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
          <AfterSalesReserveImport
            open={importDialogOpen}
            onOpenChange={setImportDialogOpen}
            onSuccess={fetchList}
          />
          <CanEdit>
            <Button
              onClick={openCreateDialog}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              新增
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
                  客户简称
                </th>
                <th className="border border-border bg-accent/50 px-4 py-2.5 text-right text-xs font-medium text-muted-foreground w-[160px]">
                  售后准备金率
                </th>
                <th className="border border-border bg-accent/50 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground w-[140px]">
                  创建时间
                </th>
                <th className="border border-border bg-accent/50 px-4 py-2.5 text-center text-xs font-medium text-muted-foreground w-[100px]">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: AfterSalesReserveItem) => (
                <tr
                  key={item.id}
                  className="border-x border-b border-border hover:bg-accent/30 transition-colors"
                >
                  <td className="px-4 py-2.5 text-foreground">
                    {item.customerShortName}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-foreground">
                    {formatRate(item.rate)}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {formatDate(item.createdAt)}
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
            <DialogTitle>
              {editingItem ? '编辑售后准备金率' : '新增售后准备金率'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? '修改售后准备金率信息'
                : '新增一条售后准备金率记录'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                客户简称
              </label>
              <Input
                placeholder="请输入客户简称"
                value={formName}
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement>,
                ) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                费率
              </label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="如 0.02 表示 2%"
                value={formRate}
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement>,
                ) => setFormRate(e.target.value)}
              />
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
              确定要删除客户「{deleteTarget?.customerShortName}
              」的售后准备金率配置吗？此操作不可撤销。
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
