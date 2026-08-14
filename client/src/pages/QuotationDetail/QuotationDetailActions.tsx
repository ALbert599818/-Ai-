import { useState } from 'react';
import { Check, X, Download, RotateCcw, Send } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import { Textarea } from '@client/src/components/ui/textarea';
import { toast } from 'sonner';
import { useAppAuth } from '@client/src/contexts/AuthContext';
import {
  approveQuotation,
  rejectQuotation,
  resubmitQuotation,
  submitQuotation,
} from '@client/src/api/quotation';
import { exportQuotationToExcel } from './quotation-export';
import type { QuotationDetailResponse } from '@shared/quotation';

const ADMIN_ROLES = ['admin', 'super_admin'];

interface QuotationDetailActionsProps {
  detail: QuotationDetailResponse;
  onStatusChange: () => void;
}

export default function QuotationDetailActions({
  detail,
  onStatusChange,
}: QuotationDetailActionsProps) {
  const { hasAnyRole } = useAppAuth();
  const isAdmin = hasAnyRole(ADMIN_ROLES);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);

  const isDraft = detail.status === 'draft';
  const canApprove = isAdmin && detail.status === 'submitted';
  const canResubmit = isAdmin && (detail.status === 'approved' || detail.status === 'rejected');
  const [resubmitOpen, setResubmitOpen] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await approveQuotation(detail.id);
      toast.success('报价单已审批通过');
      onStatusChange();
    } catch {
      toast.error('审批失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('请填写驳回原因');
      return;
    }
    setLoading(true);
    try {
      await rejectQuotation(detail.id, rejectReason);
      toast.success('报价单已驳回');
      setRejectOpen(false);
      setRejectReason('');
      onStatusChange();
    } catch {
      toast.error('驳回失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleResubmit = async () => {
    setLoading(true);
    try {
      await resubmitQuotation(detail.id);
      toast.success('报价单已退回待审批');
      setResubmitOpen(false);
      onStatusChange();
    } catch {
      toast.error('退回操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await submitQuotation(detail.id);
      toast.success('报价单已提交审批');
      onStatusChange();
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
      setLoading(false);
    }
  };

  const handleExport = () => {
    try {
      exportQuotationToExcel(detail);
      toast.success('导出成功');
    } catch {
      toast.error('导出失败');
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="gap-1.5"
        >
          <Download className="size-3.5" />
          导出 Excel
        </Button>
        {isDraft && (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={loading}
            className="gap-1.5"
          >
            <Send className="size-3.5" />
            提交报价单
          </Button>
        )}
        {canApprove && (
          <>
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={loading}
              className="gap-1.5 bg-green-600 hover:bg-green-700"
            >
              <Check className="size-3.5" />
              审批通过
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setRejectOpen(true)}
              disabled={loading}
              className="gap-1.5"
            >
              <X className="size-3.5" />
              驳回
            </Button>
          </>
        )}
        {canResubmit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setResubmitOpen(true)}
            disabled={loading}
            className="gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50"
          >
            <RotateCcw className="size-3.5" />
            退回待审
          </Button>
        )}
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md rounded-sm">
          <DialogHeader>
            <DialogTitle>驳回报价单</DialogTitle>
            <DialogDescription>
              请填写驳回原因，该信息将通知报价单创建人
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="请输入驳回原因..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            className="rounded-sm"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={loading}
            >
              确认驳回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resubmitOpen} onOpenChange={setResubmitOpen}>
        <DialogContent className="max-w-md rounded-sm">
          <DialogHeader>
            <DialogTitle>退回待审批</DialogTitle>
            <DialogDescription>
              确认将该报价单退回至待审批状态？退回后可重新审批。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResubmitOpen(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button
              onClick={handleResubmit}
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700"
            >
              确认退回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
