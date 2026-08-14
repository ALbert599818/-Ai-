import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Search,
  Check,
  X,
  Eye,
  RotateCcw,
  Send,
} from 'lucide-react';
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
import CanEdit from '@client/src/components/CanEdit';
import {
  getQuotationList,
  deleteQuotation,
  approveQuotation,
  rejectQuotation,
  resubmitQuotation,
  submitQuotation,
} from '@client/src/api/quotation';
import type {
  QuotationListItem,
} from '@shared/quotation';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'draft', label: '草稿' },
  { value: 'submitted', label: '已提交' },
  { value: 'approved', label: '已审批' },
  { value: 'rejected', label: '已驳回' },
] as const;

function getStatusBadge(
  status: string,
): { className: string; label: string } {
  switch (status) {
    case 'draft':
      return {
        className: 'bg-gray-100 text-gray-600 rounded-sm',
        label: '草稿',
      };
    case 'submitted':
      return {
        className: 'bg-blue-100 text-blue-700 rounded-sm',
        label: '已提交',
      };
    case 'approved':
      return {
        className: 'bg-green-100 text-green-700 rounded-sm',
        label: '已审批',
      };
    case 'rejected':
      return {
        className: 'bg-red-100 text-red-700 rounded-sm',
        label: '已驳回',
      };
    default:
      return {
        className: 'bg-gray-100 text-gray-600 rounded-sm',
        label: status,
      };
  }
}

function formatAmount(value: number): string {
  return `¥${value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}`;
}

export default function QuotationListPage() {
  const [items, setItems] = useState<QuotationListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] =
    useState<QuotationListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Reject dialog state
  const [rejectTarget, setRejectTarget] =
    useState<QuotationListItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Approve loading
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Resubmit loading
  const [resubmittingId, setResubmittingId] = useState<string | null>(null);

  // Submit loading
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getQuotationList({
        keyword: keyword || undefined,
        status: statusFilter || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch {
      toast.error('获取报价单列表失败');
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter, page]);

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
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteQuotation(deleteTarget.id);
      toast.success('删除成功');
      setDeleteTarget(null);
      fetchList();
    } catch {
      toast.error('删除失败');
    } finally {
      setDeleting(false);
    }
  };

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      await approveQuotation(id);
      toast.success('审批通过');
      fetchList();
    } catch {
      toast.error('审批操作失败');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (!reason) {
      toast.error('请输入驳回原因');
      return;
    }
    setRejecting(true);
    try {
      await rejectQuotation(rejectTarget.id, reason);
      toast.success('已驳回');
      setRejectTarget(null);
      setRejectReason('');
      fetchList();
    } catch {
      toast.error('驳回操作失败');
    } finally {
      setRejecting(false);
    }
  };

  const handleResubmit = async (id: string) => {
    setResubmittingId(id);
    try {
      await resubmitQuotation(id);
      toast.success('已退回待审批');
      fetchList();
    } catch {
      toast.error('退回操作失败');
    } finally {
      setResubmittingId(null);
    }
  };

  const handleSubmit = async (id: string) => {
    setSubmittingId(id);
    try {
      await submitQuotation(id);
      toast.success('报价单已提交审批');
      fetchList();
    } catch (error: unknown) {
      let msg = '提交失败，请重试';
      if (error && typeof error === 'object') {
        const axiosErr = error as { response?: { data?: { error?: { message?: string }; message?: string } }; message?: string };
        if (axiosErr.response?.data?.error?.message) {
          msg = axiosErr.response.data.error.message;
        } else if (axiosErr.response?.data?.message) {
          msg = axiosErr.response.data.message;
        } else if (axiosErr.message) {
          msg = axiosErr.message;
        }
      }
      toast.error(msg);
    } finally {
      setSubmittingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-foreground">
            报价单管理
          </h1>
          <div className="relative w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="搜索报价单号或客户简称..."
              value={keyword}
              onChange={(
                e: React.ChangeEvent<HTMLInputElement>,
              ) => setKeyword(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pl-9"
            />
          </div>
        </div>
        <Link to="/">
          <Button className="gap-1.5">
            <Plus className="size-4" />
            新建报价单
          </Button>
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 border-b border-border px-6">
        {STATUS_OPTIONS.map(
          (opt: { value: string; label: string }) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleStatusChange(opt.value)}
              className={`
                relative px-4 py-2.5 text-sm font-medium transition-colors rounded-t-sm
                ${
                  statusFilter === opt.value
                    ? 'text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              {opt.label}
            </button>
          ),
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            加载中...
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
            暂无报价单数据
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border border-border">
                <th className="border border-border bg-accent/50 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  报价单号
                </th>
                <th className="border border-border bg-accent/50 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  客户简称
                </th>
                <th className="border border-border bg-accent/50 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  客户全称
                </th>
                <th className="border border-border bg-accent/50 px-4 py-2.5 text-right text-xs font-medium text-muted-foreground w-[140px]">
                  总金额
                </th>
                <th className="border border-border bg-accent/50 px-4 py-2.5 text-center text-xs font-medium text-muted-foreground w-[100px]">
                  状态
                </th>
                <th className="border border-border bg-accent/50 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  创建人
                </th>
                <th className="border border-border bg-accent/50 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground w-[160px]">
                  创建时间
                </th>
                <th className="border border-border bg-accent/50 px-4 py-2.5 text-center text-xs font-medium text-muted-foreground w-[200px]">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: QuotationListItem) => {
                const badge = getStatusBadge(item.status);
                return (
                  <tr
                    key={item.id}
                    className="border-x border-b border-border hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-foreground font-mono tabular-nums">
                      {item.quotationNo}
                    </td>
                    <td className="px-4 py-2.5 text-foreground">
                      {item.customerShortName}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs max-w-[200px] truncate">
                      {item.customerFullName}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-foreground">
                      {formatAmount(item.totalAmount)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-foreground text-xs">
                      {item.createdByName}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs font-mono tabular-nums">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <Link to={`/quotations/${item.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="size-3.5" />
                          </Button>
                        </Link>
                        {item.status === 'draft' && (
                          <CanEdit>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={submittingId === item.id}
                              onClick={() => handleSubmit(item.id)}
                              className="h-7 px-2 text-muted-foreground hover:text-primary"
                              title="提交审批"
                            >
                              <Send className="size-3.5" />
                            </Button>
                          </CanEdit>
                        )}
                        {item.status === 'submitted' && (
                          <CanEdit>
                            <div className="flex items-center gap-0.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={
                                  approvingId === item.id
                                }
                                onClick={() =>
                                  handleApprove(item.id)
                                }
                                className="h-7 px-2 text-muted-foreground hover:text-green-600"
                              >
                                <Check className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setRejectTarget(item)
                                }
                                className="h-7 px-2 text-muted-foreground hover:text-red-600"
                              >
                                <X className="size-3.5" />
                              </Button>
                            </div>
                          </CanEdit>
                        )}
                        {(item.status === 'approved' || item.status === 'rejected') && (
                          <CanEdit>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={resubmittingId === item.id}
                              onClick={() => handleResubmit(item.id)}
                              className="h-7 px-2 text-muted-foreground hover:text-amber-600"
                              title="退回待审"
                            >
                              <RotateCcw className="size-3.5" />
                            </Button>
                          </CanEdit>
                        )}
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
                );
              })}
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
              onClick={() => setPage((p: number) => p - 1)}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p: number) => p + 1)}
            >
              下一页
            </Button>
          </div>
        </div>
      )}

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
              确定要删除报价单「
              {deleteTarget?.quotationNo}
              」吗？此操作不可撤销。
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

      {/* Reject Dialog */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setRejectTarget(null);
            setRejectReason('');
          }
        }}
      >
        <DialogContent className="rounded-sm max-w-lg">
          <DialogHeader>
            <DialogTitle>驳回报价单</DialogTitle>
            <DialogDescription>
              请输入驳回原因，该信息将通知报价单创建人。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm font-medium text-muted-foreground">
              驳回原因
            </label>
            <Input
              placeholder="请输入驳回原因..."
              value={rejectReason}
              onChange={(
                e: React.ChangeEvent<HTMLInputElement>,
              ) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectTarget(null);
                setRejectReason('');
              }}
              disabled={rejecting}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejecting}
            >
              {rejecting ? '驳回中...' : '确认驳回'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
