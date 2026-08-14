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
  getAlertThreshold,
  updateAlertThreshold,
} from '@client/src/api/global-config';
import CanEdit from '@client/src/components/CanEdit';

export default function AlertThreshold() {
  const [highInput, setHighInput] = useState('');
  const [midInput, setMidInput] = useState('');
  const [currentHigh, setCurrentHigh] = useState<number | null>(
    null,
  );
  const [currentMid, setCurrentMid] = useState<number | null>(
    null,
  );
  const [updatedAt, setUpdatedAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAlertThreshold();
      setCurrentHigh(data.highPercent);
      setCurrentMid(data.midPercent);
      setHighInput((data.highPercent * 100).toFixed(0));
      setMidInput((data.midPercent * 100).toFixed(0));
      setUpdatedAt(data.updatedAt);
    } catch {
      toast.error('获取告警阈值失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    const highVal = parseFloat(highInput);
    const midVal = parseFloat(midInput);

    if (isNaN(highVal) || highVal < 0 || highVal > 100) {
      toast.error('黄色告警阈值需在 0-100 之间');
      return;
    }
    if (isNaN(midVal) || midVal < 0 || midVal > 100) {
      toast.error('红色告警阈值需在 0-100 之间');
      return;
    }
    if (midVal >= highVal) {
      toast.error('红色告警阈值需小于黄色告警阈值');
      return;
    }

    setSaving(true);
    try {
      const data = await updateAlertThreshold({
        highPercent: highVal / 100,
        midPercent: midVal / 100,
      });
      setCurrentHigh(data.highPercent);
      setCurrentMid(data.midPercent);
      setHighInput((data.highPercent * 100).toFixed(0));
      setMidInput((data.midPercent * 100).toFixed(0));
      setUpdatedAt(data.updatedAt);
      toast.success('告警阈值已更新');
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
          告警阈值配置
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <Card className="rounded-sm shadow-none max-w-lg">
          <CardHeader>
            <CardTitle className="text-base">
              毛利率告警阈值
            </CardTitle>
            <CardDescription>
              配置告警阈值用于报价毛利率监控。实际毛利率与目标毛利率的比值用于判定告警级别。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* High threshold */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  黄色告警阈值（%）
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={highInput}
                    onChange={(
                      e: React.ChangeEvent<HTMLInputElement>,
                    ) => setHighInput(e.target.value)}
                    className="font-mono tabular-nums text-right w-[160px]"
                    placeholder="如 80"
                  />
                  <span className="text-sm text-muted-foreground">
                    %
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  实际毛利率 &gt; 目标毛利率 ×
                  <span className="font-mono tabular-nums text-foreground">
                    {' '}
                    {highInput || '—'}%
                  </span>{' '}
                  → 不告警
                </p>
              </div>

              {/* Mid threshold */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  红色告警阈值（%）
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={midInput}
                    onChange={(
                      e: React.ChangeEvent<HTMLInputElement>,
                    ) => setMidInput(e.target.value)}
                    className="font-mono tabular-nums text-right w-[160px]"
                    placeholder="如 10"
                  />
                  <span className="text-sm text-muted-foreground">
                    %
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  实际毛利率 ≤ 目标毛利率 ×
                  <span className="font-mono tabular-nums text-foreground">
                    {' '}
                    {midInput || '—'}%
                  </span>{' '}
                  → 红色告警
                </p>
              </div>

              {/* Alert rule explanation */}
              <div className="border border-border rounded-sm p-3 space-y-1">
                <p className="text-xs font-medium text-foreground">
                  告警规则说明
                </p>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>
                    <span className="inline-block w-3 h-3 rounded-sm mr-1.5 align-middle" style={{ backgroundColor: 'hsl(150, 60%, 38%)' }} />
                    正常：实际毛利率 &gt; 目标毛利率 × 高阈值
                  </p>
                  <p>
                    <span className="inline-block w-3 h-3 rounded-sm mr-1.5 align-middle" style={{ backgroundColor: 'hsl(38, 90%, 45%)' }} />
                    黄色告警：低阈值 &lt; 实际毛利率 ≤ 高阈值
                  </p>
                  <p>
                    <span className="inline-block w-3 h-3 rounded-sm mr-1.5 align-middle" style={{ backgroundColor: 'hsl(0, 72%, 48%)' }} />
                    红色告警：实际毛利率 ≤ 低阈值
                  </p>
                </div>
              </div>

              {currentHigh !== null && currentMid !== null && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    当前值：高阈值{' '}
                    <span className="font-mono tabular-nums text-foreground">
                      {(currentHigh * 100).toFixed(0)}%
                    </span>
                    ，低阈值{' '}
                    <span className="font-mono tabular-nums text-foreground">
                      {(currentMid * 100).toFixed(0)}%
                    </span>
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
