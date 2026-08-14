import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@client/src/components/ui/card';
import { Input } from '@client/src/components/ui/input';
import { Label } from '@client/src/components/ui/label';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import { useAppAuth } from '@client/src/contexts/AuthContext';
import {
  getPricingFormulaConfig,
  updatePricingFormulaConfig,
  resetPricingFormulaConfig,
} from '@client/src/api/pricing-formula-config';
import type { PricingFormulaValue } from '@shared/pricing-formula-config';

interface ParamMeta {
  key: string;
  label: string;
  description: string;
  step: number;
  min: number;
  max: number;
}

const PARAM_META: ParamMeta[] = [
  {
    key: 'gradeFactor',
    label: '客户等级系数',
    description: '客户等级系数，折扣类客户 K<1 拉低单价',
    step: 0.01,
    min: 0,
    max: 10,
  },
  {
    key: 'sensitivityFactor',
    label: '价格敏感系数',
    description: '价格敏感系数，根据区域和市场敏感度调整报价',
    step: 0.01,
    min: 0,
    max: 10,
  },
  {
    key: 'logisticsFactor',
    label: '物流成本系数',
    description: '物流成本系数，按物流方式调整成本加成',
    step: 0.01,
    min: 0,
    max: 10,
  },
  {
    key: 'insuranceFactor',
    label: '保费系数',
    description: '保费系数，按信用条件调整保费成本',
    step: 0.01,
    min: 0,
    max: 10,
  },
  {
    key: 'creditFactor',
    label: '信用条件系数',
    description: '信用条件系数，按付款条件调整信用成本',
    step: 0.01,
    min: 0,
    max: 10,
  },
  {
    key: 'quantityFactor',
    label: '拿货量系数',
    description: '拿货量系数，根据采购量与 MOQ 倍数调整',
    step: 0.01,
    min: 0,
    max: 10,
  },
  {
    key: 'exchangeRiskRate',
    label: '固定汇率风险准备金率',
    description: '汇率波动准备金率，计入总准备金率',
    step: 0.001,
    min: 0,
    max: 1,
  },
  {
    key: 'defaultTargetMargin',
    label: '默认目标毛利率',
    description: '产品默认目标毛利率，影响最终单价',
    step: 0.01,
    min: 0,
    max: 1,
  },
  {
    key: 'flexibleReserveRate',
    label: '灵活准备金率',
    description: '灵活准备金率，作为额外准备金计入成本',
    step: 0.001,
    min: 0,
    max: 1,
  },
  {
    key: 'taxRate',
    label: '税率',
    description: '增值税税率，用于含税价换算',
    step: 0.01,
    min: 0,
    max: 1,
  },
];

function formatDisplayValue(key: string, value: number): string {
  if (['exchangeRiskRate', 'defaultTargetMargin', 'flexibleReserveRate', 'taxRate'].includes(key)) {
    return `${(value * 100).toFixed(2)}%`;
  }
  return value.toFixed(2);
}

const PricingFormulaConfig = () => {
  const { hasRole } = useAppAuth();
  const isSuperAdmin = hasRole('super_admin');

  const [config, setConfig] = useState<PricingFormulaValue | null>(null);
  const [editedConfig, setEditedConfig] = useState<PricingFormulaValue | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const result = await getPricingFormulaConfig();
      setConfig(result.configValue);
      setEditedConfig({ ...result.configValue });
    } catch {
      toast.error('Failed to load pricing formula config');
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (key: string, rawValue: string) => {
    const numVal = parseFloat(rawValue);
    if (isNaN(numVal)) return;
    setEditedConfig((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: numVal };
    });
  };

  const handleSave = async () => {
    if (!editedConfig) return;
    try {
      setSaving(true);
      const result = await updatePricingFormulaConfig(editedConfig);
      setConfig(result.configValue);
      setEditedConfig({ ...result.configValue });
      toast.success('Configuration saved successfully');
    } catch {
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setResetting(true);
      setShowResetDialog(false);
      const result = await resetPricingFormulaConfig();
      setConfig(result.configValue);
      setEditedConfig({ ...result.configValue });
      toast.success('Configuration reset to defaults');
    } catch {
      toast.error('Failed to reset configuration');
    } finally {
      setResetting(false);
    }
  };

  const isModified = (): boolean => {
    if (!config || !editedConfig) return false;
    return PARAM_META.some(
      (p) => config[p.key] !== editedConfig[p.key],
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading configuration...</p>
      </div>
    );
  }

  if (!editedConfig) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">No configuration data available</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Pricing Formula Configuration
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          These parameters determine the pricing calculation logic for all products.
          Changes take effect immediately on new quotations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Formula Parameters</CardTitle>
              <CardDescription>
                Adjust coefficients and rates used in the pricing formula chain
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {editedConfig.formulaVersion || 'v1'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {PARAM_META.map((param) => {
              const currentValue = Number(editedConfig[param.key as keyof PricingFormulaValue] ?? 0);
              const originalValue = config ? Number(config[param.key as keyof PricingFormulaValue] ?? 0) : 0;
              const changed = currentValue !== originalValue;

              return (
                <div key={param.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor={param.key}
                      className="text-sm font-medium"
                    >
                      {param.label}
                      {changed && (
                        <span className="ml-2 text-xs text-amber-600">
                          (modified)
                        </span>
                      )}
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {formatDisplayValue(param.key, currentValue)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      id={param.key}
                      type="number"
                      step={param.step}
                      min={param.min}
                      max={param.max}
                      value={currentValue}
                      disabled={!isSuperAdmin || saving || resetting}
                      onChange={(e) =>
                        handleValueChange(param.key, e.target.value)
                      }
                      className="w-32"
                    />
                    <span className="flex-1 text-xs text-muted-foreground">
                      {param.description}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {isSuperAdmin && (
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={saving || resetting || !isModified()}
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowResetDialog(true)}
            disabled={saving || resetting}
          >
            Reset to Defaults
          </Button>
        </div>
      )}

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Reset</DialogTitle>
            <DialogDescription>
              This will restore all parameters to their default values.
              All current modifications will be lost. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReset}
            >
              Confirm Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingFormulaConfig;
