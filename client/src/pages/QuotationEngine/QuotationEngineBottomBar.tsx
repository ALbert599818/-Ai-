import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/lark-shim/logger';
import { saveQuotation, submitQuotation } from '@client/src/api/quotation';
import { toast } from 'sonner';
import type { QuotationResult } from './QuotationEngineSummary';
import type { SaveQuotationRequest } from '@shared/quotation';

interface QuotationEngineBottomBarProps {
  result: QuotationResult;
  saveRequest: SaveQuotationRequest | null;
}

const QuotationEngineBottomBar = ({
  result,
  saveRequest,
}: QuotationEngineBottomBarProps) => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const canSave: boolean = saveRequest !== null;

  const handleSave = async () => {
    if (!saveRequest) return;
    setSaving(true);
    try {
      const { id } = await saveQuotation(saveRequest);
      toast.success('报价单已保存为草稿');
      navigate(`/quotations/${id}`);
    } catch (error: unknown) {
      logger.error('Save quotation failed', error);
      let msg = '保存失败，请重试';
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
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!saveRequest) return;
    setSaving(true);
    try {
      const { id } = await saveQuotation(saveRequest);
      await submitQuotation(id);
      toast.success('报价单已提交审批');
      navigate('/quotations');
    } catch (error: unknown) {
      logger.error('Submit quotation failed', error);
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
      setSaving(false);
    }
  };

  return (
    <div className="sticky bottom-0 z-10 bg-background mt-6 flex flex-wrap items-center justify-between gap-6 border-t border-border px-6 py-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-sm font-bold text-foreground">最终报价</span>
        <span className="rounded-sm border border-border bg-card px-4 py-1 font-mono text-2xl font-bold tabular-nums text-foreground">
          ¥{result.total.toFixed(2)}
        </span>
        <span className="rounded-sm bg-accent px-2 py-0.5 font-mono text-xs text-foreground/80 font-semibold">
          基价 ¥{result.basePrice.toFixed(2)}
        </span>
        <span className="rounded-sm bg-accent px-2 py-0.5 font-mono text-xs text-foreground/80 font-semibold">
          + 费用 ¥{result.feesTotal.toFixed(2)}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          disabled={!canSave || saving}
          onClick={handleSave}
          className="gap-2 rounded-sm"
        >
          <Save className="size-4" />
          保存草稿
        </Button>
        <Button
          disabled={!canSave || saving}
          onClick={handleSubmit}
          className="gap-2 rounded-sm"
        >
          <Send className="size-4" />
          提交报价单
        </Button>
      </div>
    </div>
  );
};

export default QuotationEngineBottomBar;
