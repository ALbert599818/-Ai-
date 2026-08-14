import { useState, useEffect, useCallback } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@client/src/components/ui/card';
import { toast } from 'sonner';
import { logger } from '@/lib/lark-shim/logger';
import {
  getTaxRate,
  updateTaxRate,
} from '@client/src/api/global-config';
import CanEdit from '@client/src/components/CanEdit';

export default function TaxRate() {
  const [rateInput, setRateInput] = useState('');
  const [currentRate, setCurrentRate] = useState<number | null>(
    null,
  );
  const [updatedAt, setUpdatedAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTaxRate();
      const percentValue = (data.rate * 100).toFixed(2);
      setCurrentRate(data.rate);
      setRateInput(percentValue);
      setUpdatedAt(data.updatedAt);
    } catch {
      toast.error('获取税率失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    const percentValue = parseFloat(rateInput);
    if (isNaN(percentValue) || percentValue < 0) {
      toast.error('请输入有效的百分比数值');
      return;
    }

    const decimalRate = percentValue / 100;
    setSaving(true);
    try {
      const data = await updateTaxRate({ rate: decimalRate });
      setCurrentRate(data.rate);
      setRateInput((data.rate * 100).toFixed(2));
      setUpdatedAt(data.updatedAt);
      toast.success('税率已更新');
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
        toast.error(resp?.data?.message || '保存失败');
      } else {
        toast.error('保存失败');
      }
    } finally {
      setSaving(false);
    }
  };

  const formatUpdatedAt = (isoStr: string): string => {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        加载中...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-lg font-semibold text-foreground">
          税率管理
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <Card className="rounded-sm shadow-none max-w-lg">
          <CardHeader>
            <CardTitle className="text-base">
              当前税率
            </CardTitle>
            <CardDescription>
              设置增值税税率，用于报价计算中的税额估算。
              输入百分比值，如 13 表示 13%（即 0.13）。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  税率（%）
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={rateInput}
                    onChange={(
                      e: React.ChangeEvent<HTMLInputElement>,
                    ) => setRateInput(e.target.value)}
                    className="font-mono tabular-nums text-right w-[160px]"
                    placeholder="如 13.00"
                  />
                  <span className="text-sm text-muted-foreground">
                    %
                  </span>
                </div>
              </div>

              {currentRate !== null && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    当前值：
                    <span className="font-mono tabular-nums text-foreground">
                      {(currentRate * 100).toFixed(2)}%
                    </span>
                    （小数：
                    <span className="font-mono tabular-nums text-foreground">
                      {currentRate}
                    </span>
                    ）
                  </p>
                  {updatedAt && (
                    <p>
                      最后更新：
                      {formatUpdatedAt(updatedAt)}
                    </p>
                  )}
                </div>
              )}

              <CanEdit>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-1.5"
                >
                  <Save className="size-4" />
                  {saving ? '保存中...' : '保存'}
                </Button>
              </CanEdit>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
