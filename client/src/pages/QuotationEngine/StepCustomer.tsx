import { useState, useRef, useEffect } from 'react';
import { Search, X, User, UserPlus, ChevronDown, ChevronRight } from 'lucide-react';
import { useAppAuth } from '@client/src/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  PRODUCT_CATEGORIES,
  GRADE_OPTIONS,
} from '@shared/customer';
import type { ProductCategoryItem } from '@shared/product-category';
import type { MockCustomer } from './QuotationEngineSearchBar';

export type CustomerType = 'existing' | 'new';

export interface NewCustomerInfo {
  name: string;
  country: string;
  region: string;
  channelType: string;
  creditTerm: string;
}

interface StepCustomerProps {
  customers: MockCustomer[];
  selectedCustomer: MockCustomer | null;
  onSelectCustomer: (customer: MockCustomer | null) => void;
  customerType: CustomerType;
  onCustomerTypeChange: (type: CustomerType) => void;
  newCustomerInfo: NewCustomerInfo;
  onNewCustomerChange: (info: NewCustomerInfo) => void;
  isSuperAdmin: boolean;
  categoryGrades: Record<string, string>;
  onCategoryGradesChange: (grades: Record<string, string>) => void;
  creditTermOptions: string[];
  categoryList: ProductCategoryItem[];
}

const CHANNEL_TYPES: string[] = ['直销', '经销', '代理', 'OEM'];

const DEFAULT_REGIONS: string[] = [
  '欧美',
  '澳新日韩',
  '拉美',
  '东南亚',
  '其他地区',
];

const StepCustomer = ({
  customers,
  selectedCustomer,
  onSelectCustomer,
  customerType,
  onCustomerTypeChange,
  newCustomerInfo,
  onNewCustomerChange,
  isSuperAdmin,
  categoryGrades,
  onCategoryGradesChange,
  creditTermOptions,
  categoryList,
}: StepCustomerProps) => {
  const categoryNames = categoryList.length > 0
    ? categoryList.map((c: ProductCategoryItem) => c.name)
    : PRODUCT_CATEGORIES.slice();

  const { user } = useAppAuth();
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [gradesExpanded, setGradesExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 非超管自动预填区域
  useEffect(() => {
    if (!isSuperAdmin && user?.region && !newCustomerInfo.region) {
      onNewCustomerChange({ ...newCustomerInfo, region: user.region });
    }
  }, [isSuperAdmin, user?.region]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = customers.filter((c: MockCustomer) =>
    c.name.toLowerCase().includes(query.toLowerCase()),
  );

  const regions: string[] = DEFAULT_REGIONS;
  const creditTerms: string[] = creditTermOptions.length > 0
    ? creditTermOptions
    : [...new Set(customers.map((c: MockCustomer) => c.creditTerm).filter(Boolean))];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTypeChange = (type: CustomerType) => {
    onCustomerTypeChange(type);
    if (type === 'new') {
      onSelectCustomer(null);
    }
  };

  const handleSelectExisting = (c: MockCustomer) => {
    onSelectCustomer(c);
    setQuery('');
    setShowDropdown(false);
  };

  const handleFieldChange = (field: keyof NewCustomerInfo, value: string) => {
    onNewCustomerChange({ ...newCustomerInfo, [field]: value });
  };

  const handleCategoryGradeChange = (category: string, grade: string) => {
    onCategoryGradesChange({ ...categoryGrades, [category]: grade });
  };

  return (
    <div className="border-l-[3px] border-l-primary border-y border-r border-border rounded-sm bg-card p-5">
      <div className="mb-4 border-b border-border pb-2 font-mono text-xs font-bold tracking-wider text-foreground">
        — 第1步 · 客户信息
      </div>

      {/* Customer type toggle */}
      <div className="mb-4 inline-flex rounded-sm border border-border">
        <button
          type="button"
          onClick={() => handleTypeChange('existing')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
            customerType === 'existing'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-muted-foreground hover:bg-accent'
          }`}
        >
          <User className="size-3.5" />
          老客户
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('new')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
            customerType === 'new'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-muted-foreground hover:bg-accent'
          }`}
        >
          <UserPlus className="size-3.5" />
          新客户
        </button>
      </div>

      {/* Existing customer search */}
      {customerType === 'existing' && (
        <div ref={dropdownRef} className="relative">
          <Label className="mb-1.5 block text-xs font-bold text-foreground/90">
            选择客户
          </Label>
          {selectedCustomer ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {/* 客户名称 */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground/90">选择客户</Label>
                <div className="flex h-9 items-center justify-between rounded-sm border border-border bg-accent/50 px-3">
                  <span className="text-sm font-medium text-foreground">{selectedCustomer.name}</span>
                  <button
                    type="button"
                    onClick={() => onSelectCustomer(null)}
                    className="ml-2 shrink-0 rounded-sm p-0.5 text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>
              {/* 国家 */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground/90">国家</Label>
                <div className="flex h-9 items-center rounded-sm border border-border bg-accent/50 px-3 text-sm text-foreground">
                  —
                </div>
              </div>
              {/* 区域 */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground/90">区域</Label>
                <div className="flex h-9 items-center rounded-sm border border-border bg-accent/50 px-3 text-sm text-foreground">
                  {selectedCustomer.region || '—'}
                </div>
              </div>
              {/* 渠道类型 */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground/90">渠道类型</Label>
                <div className="flex h-9 items-center rounded-sm border border-border bg-accent/50 px-3 text-sm text-foreground">
                  {selectedCustomer.mode || '—'}
                </div>
              </div>
              {/* 信用条件 */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground/90">信用条件</Label>
                <div className="flex h-9 items-center rounded-sm border border-border bg-accent/50 px-3 text-sm text-foreground">
                  {selectedCustomer.creditTerm || '—'}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="搜索客户名称或编码..."
                className="h-9 rounded-sm border-border pl-8 font-mono text-sm"
              />
            </div>
          )}
          {showDropdown && !selectedCustomer && (
            <div className="absolute left-0 top-full z-10 mt-1 max-h-48 w-full overflow-auto rounded-sm border border-border bg-card shadow-md">
              {filtered.length > 0 ? (
                filtered.map((c: MockCustomer) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectExisting(c)}
                    className="flex w-full items-center justify-between border-b border-border/50 px-3 py-2 text-left text-sm last:border-0 hover:bg-accent"
                  >
                    <span className="font-medium text-foreground">{c.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {c.region}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  未找到 &ldquo;{query}&rdquo;
                </div>
              )}
            </div>
          )}

          {/* Category grades table for existing customer */}
          {selectedCustomer && (
            <div className="mt-4 border border-border rounded-sm">
              <button
                type="button"
                onClick={() => setGradesExpanded(!gradesExpanded)}
                className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-accent/30 transition-colors"
              >
                <Label className="mb-0 text-xs font-bold text-foreground cursor-pointer">
                  品类等级
                </Label>
                {gradesExpanded ? (
                  <ChevronDown className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 text-muted-foreground" />
                )}
              </button>
              {gradesExpanded && (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs font-bold text-foreground">品类</TableHead>
                      <TableHead className="text-xs font-bold text-foreground">等级</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryNames.map((cat: string) => (
                      <TableRow key={cat} className="hover:bg-transparent">
                        <TableCell className="text-xs font-medium">{cat}</TableCell>
                        <TableCell className="text-xs text-foreground/80 font-semibold">
                          {categoryGrades[cat] || '无'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </div>
      )}

      {/* New customer form */}
      {customerType === 'new' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground/90">
              客户名称 <span className="text-destructive">*</span>
            </Label>
            <Input
              value={newCustomerInfo.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleFieldChange('name', e.target.value)
              }
              placeholder="输入客户名称"
              className="h-9 rounded-sm border-border text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground/90">国家</Label>
            <Input
              value={newCustomerInfo.country}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleFieldChange('country', e.target.value)
              }
              placeholder="如：中国"
              className="h-9 rounded-sm border-border text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground/90">
              区域 <span className="text-destructive">*</span>
              {!isSuperAdmin && (
                <span className="ml-1 text-[10px] text-muted-foreground">
                  (仅超管可修改)
                </span>
              )}
            </Label>
            <Select
              value={newCustomerInfo.region}
              onValueChange={(v: string) => handleFieldChange('region', v)}
              disabled={!isSuperAdmin}
            >
              <SelectTrigger className="h-9 rounded-sm border-border text-sm disabled:opacity-60">
                <SelectValue placeholder="选择区域" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((r: string) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
                {regions.length === 0 && (
                  <SelectItem value="other">其他</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground/90">
              渠道类型 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={newCustomerInfo.channelType}
              onValueChange={(v: string) => handleFieldChange('channelType', v)}
            >
              <SelectTrigger className="h-9 rounded-sm border-border text-sm">
                <SelectValue placeholder="选择渠道" />
              </SelectTrigger>
              <SelectContent>
                {CHANNEL_TYPES.map((t: string) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground/90">
              信用条件 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={newCustomerInfo.creditTerm}
              onValueChange={(v: string) => handleFieldChange('creditTerm', v)}
            >
              <SelectTrigger className="h-9 rounded-sm border-border text-sm">
                <SelectValue placeholder="选择信用条件" />
              </SelectTrigger>
              <SelectContent>
                {creditTerms.map((t: string) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
                {creditTerms.length === 0 && (
                  <SelectItem value="standard">标准</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Category grades table for new customer */}
      {customerType === 'new' && (
        <div className="mt-4 border border-border rounded-sm">
          <button
            type="button"
            onClick={() => setGradesExpanded(!gradesExpanded)}
            className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-accent/30 transition-colors"
          >
            <Label className="mb-0 text-xs font-semibold text-muted-foreground cursor-pointer">
              品类等级
            </Label>
            {gradesExpanded ? (
              <ChevronDown className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 text-muted-foreground" />
            )}
          </button>
          {gradesExpanded && (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">品类</TableHead>
                  <TableHead className="min-w-[120px] text-xs">等级</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryNames.map((cat: string) => (
                  <TableRow key={cat} className="hover:bg-transparent">
                    <TableCell className="text-xs font-medium">{cat}</TableCell>
                    <TableCell>
                      <Select
                        value={categoryGrades[cat] || '无'}
                        onValueChange={(v: string) =>
                          handleCategoryGradeChange(cat, v)
                        }
                        disabled={!isSuperAdmin}
                      >
                        <SelectTrigger className="h-8 w-[100px] rounded-sm border-border text-xs disabled:opacity-60">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GRADE_OPTIONS.map((g: string) => (
                            <SelectItem key={g} value={g}>
                              {g}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
};

export default StepCustomer;
