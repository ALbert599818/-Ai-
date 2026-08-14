import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { Switch } from '@client/src/components/ui/switch';
import { toast } from 'sonner';
import type { ProductItem } from '@shared/product';

const SERIES_OPTIONS = [
  '音频端',
  'PC端',
  '移动端',
  '智能手表端',
  '小家电端',
  '投影仪端',
  '游戏品类端',
] as const;

const CATEGORY_OPTIONS = [
  '音频-耳机',
  '音频-音箱',
  'PC-游戏耳机',
  'PC-非耳机',
  '游戏品类',
  '移动',
  '投影仪',
  '手表',
  '小家电',
] as const;

const GRADE_OPTIONS = ['S', 'A', 'B', '无'] as const;

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: ProductItem | null;
  onSave: (data: ProductFormData) => Promise<void>;
}

export interface ProductFormData {
  code: string;
  model: string;
  series: string;
  erpCategory: string;
  category: string;
  color: string;
  productGrade: string;
  purchasePrice: string;
  rdCost: string;
  moq: string;
  isNewProduct: boolean;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  editingItem,
  onSave,
}: ProductFormDialogProps) {
  const [formCode, setFormCode] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formSeries, setFormSeries] = useState('');
  const [formErpCategory, setFormErpCategory] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formIsNew, setFormIsNew] = useState(true);
  const [formColor, setFormColor] = useState('');
  const [formGrade, setFormGrade] = useState('无');
  const [formPrice, setFormPrice] = useState('');
  const [formRdCost, setFormRdCost] = useState('0');
  const [formMoq, setFormMoq] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingItem) {
        setFormCode(editingItem.code || '');
        setFormModel(editingItem.model);
        setFormSeries(editingItem.series || '');
        setFormErpCategory(editingItem.erpCategory || '');
        setFormCategory(editingItem.category || '');
        setFormIsNew(editingItem.isNewProduct);
        setFormColor(editingItem.color);
        setFormGrade(editingItem.productGrade || '无');
        setFormPrice(editingItem.purchasePrice);
        setFormRdCost(editingItem.rdCost || '0');
        setFormMoq(String(editingItem.moq));
      } else {
        setFormCode('');
        setFormModel('');
        setFormSeries('');
        setFormErpCategory('');
        setFormCategory('');
        setFormIsNew(true);
        setFormColor('');
        setFormGrade('无');
        setFormPrice('');
        setFormRdCost('0');
        setFormMoq('');
      }
    }
  }, [open, editingItem]);

  const handleSave = async () => {
    const model = formModel.trim();
    const color = formColor.trim();
    const purchasePrice = formPrice.trim();
    const moq = parseInt(formMoq, 10);

    if (!model) {
      toast.error('请输入产品型号');
      return;
    }
    if (!color) {
      toast.error('请输入商品颜色');
      return;
    }
    const priceNum = parseFloat(purchasePrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('采购价格必须为正数');
      return;
    }
    if (isNaN(moq) || moq <= 0 || !Number.isInteger(moq)) {
      toast.error('MOQ 必须为正整数');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        code: formCode.trim(),
        model,
        series: formSeries,
        erpCategory: formErpCategory.trim(),
        category: formCategory,
        color,
        productGrade: formGrade,
        purchasePrice,
        rdCost: formRdCost.trim() || '0',
        moq: formMoq,
        isNewProduct: formIsNew,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-sm max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? '编辑商品' : '新建商品'}
          </DialogTitle>
          <DialogDescription>
            {editingItem
              ? '修改商品的各项属性信息'
              : '创建新商品，填写各项属性信息'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* 编码 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              编码
            </label>
            <Input
              value={editingItem ? formCode : ''}
              readOnly
              placeholder={editingItem ? '' : '自动生成'}
              className="bg-muted"
            />
          </div>
          {/* 产品型号 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              产品型号 <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="例如：HW-2024-001"
              value={formModel}
              onChange={(
                e: React.ChangeEvent<HTMLInputElement>,
              ) => setFormModel(e.target.value)}
            />
          </div>
          {/* 系列 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              系列
            </label>
            <Select
              value={formSeries}
              onValueChange={setFormSeries}
            >
              <SelectTrigger>
                <SelectValue placeholder="请选择系列（可选）" />
              </SelectTrigger>
              <SelectContent>
                {SERIES_OPTIONS.map((s: string) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* ERP品类 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              ERP品类
            </label>
            <Input
              placeholder="请输入ERP品类（可选）"
              value={formErpCategory}
              onChange={(
                e: React.ChangeEvent<HTMLInputElement>,
              ) => setFormErpCategory(e.target.value)}
            />
          </div>
          {/* 品类 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              品类
            </label>
            <Select
              value={formCategory}
              onValueChange={setFormCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="请选择品类（可选）" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((c: string) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* 新品/老品 */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">
              新品/老品
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formIsNew ? '新品' : '老品'}
              </span>
              <Switch
                checked={formIsNew}
                onCheckedChange={setFormIsNew}
              />
            </div>
          </div>
          {/* 商品颜色 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              商品颜色 <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="例如：黑色、白色"
              value={formColor}
              onChange={(
                e: React.ChangeEvent<HTMLInputElement>,
              ) => setFormColor(e.target.value)}
            />
          </div>
          {/* 产品级别 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              产品级别
            </label>
            <Select
              value={formGrade}
              onValueChange={setFormGrade}
            >
              <SelectTrigger>
                <SelectValue placeholder="请选择产品级别" />
              </SelectTrigger>
              <SelectContent>
                {GRADE_OPTIONS.map((g: string) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* 采购价格 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              采购价格(元){' '}
              <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="请输入采购价格"
              value={formPrice}
              onChange={(
                e: React.ChangeEvent<HTMLInputElement>,
              ) => setFormPrice(e.target.value)}
            />
          </div>
          {/* 研发成本 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              研发成本
            </label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="请输入研发成本"
              value={formRdCost}
              onChange={(
                e: React.ChangeEvent<HTMLInputElement>,
              ) => setFormRdCost(e.target.value)}
            />
          </div>
          {/* MOQ */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              MOQ (最小起订量){' '}
              <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="请输入最小起订量"
              value={formMoq}
              onChange={(
                e: React.ChangeEvent<HTMLInputElement>,
              ) => setFormMoq(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
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
  );
}
