import { useState, useEffect, useCallback, Fragment } from 'react';
import {
  Plus, Pencil, Trash2, Search, Upload, Download, FileDown, ChevronDown, ChevronRight,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { logger } from '@/lib/lark-shim/logger';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@client/src/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@client/src/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@client/src/components/ui/select';
import { toast } from 'sonner';
import {
  getCustomerList, createCustomer, updateCustomer, deleteCustomer,
  getCustomerCategoryGrades, updateCustomerCategoryGrades,
} from '@client/src/api/customer';
import type { CustomerItem, CreateCustomerRequest } from '@shared/customer';
import { PRODUCT_CATEGORIES, GRADE_OPTIONS } from '@shared/customer';
import { getProductCategories } from '@client/src/api/product-category';
import type { ProductCategoryItem } from '@shared/product-category';
import CanEdit from '@client/src/components/CanEdit';
import { useAppAuth } from '@client/src/contexts/AuthContext';
import CustomerCategoryGrades from './CustomerCategoryGrades';

const PAGE_SIZE = 20;
const REGION_OPTIONS = ['欧美', '澳新日韩', '拉美', '东南亚', '其他地区'] as const;
const CHANNEL_TYPE_OPTIONS = ['B2B', 'B2C'] as const;
const SALES_CHANNEL_OPTIONS = ['自营店铺', '平台店铺', '线下分销', '企业采购'] as const;

const IMPORT_HEADERS = [
  '客户编码', '简称', '收款条件', '国家', '客户销售渠道',
  '信用条件', '所属区域', '客户渠道类型', '音频-耳机等级', '音频-音箱等级',
  'PC-游戏耳机等级', 'PC-非耳机等级', '游戏品类等级', '移动等级',
  '投影仪等级', '手表等级', '小家电等级', '售后准备金系数', '超额营销费用率',
];

const IMPORT_SAMPLE_ROW = [
  '', '示例客户', '30天', '中国', 'B2B', 'A', '欧美', '线上',
  'A', 'A', 'B', 'B', 'A', 'A', 'B', 'B', 'A',
  '0.02', '0.05',
];

const HEADER_ALIASES: Record<string, string[]> = {
  customerCode: ['客户编码', '编码', '客户代码'],
  shortName: ['简称', '客户简称', '客户名称', '简称名'],
  paymentTerm: ['收款条件', '付款条件', '账期'],
  country: ['国家', '所在国家'],
  salesChannel: ['客户销售渠道', '销售渠道'],
  creditCondition: ['信用条件', '信用账期'],
  region: ['区域', '所属区域', '地区', '所在区域'],
  channelType: ['客户渠道类型', '渠道类型'],
};

function downloadCustomerTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([IMPORT_HEADERS, IMPORT_SAMPLE_ROW]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '客户导入');
  XLSX.writeFile(wb, '客户导入模板.xlsx');
}
interface ParsedRow {
  customerCode: string; shortName: string; paymentTerm: string;
  country: string; salesChannel: string;
  creditCondition: string; region: string; channelType: string;
  categoryGrades: Record<string, string>;
}

function findHeaderIndex(headers: string[], aliases: string[]): number {
  return headers.findIndex((h: string) =>
    aliases.some((a: string) => String(h).trim().includes(a)),
  );
}

function findColumnByAlias(headerRow: string[], aliases: string[]): number {
  return headerRow.findIndex((h: string | number) => {
    const cell = String(h ?? '').trim();
    return aliases.some((a: string) => cell === a);
  });
}

function parseCustomerExcel(file: File, categoryNames: string[]): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]!];
        const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        if (rows.length < 2) { reject(new Error('Excel 文件中没有数据行')); return; }

        const headers = (rows[0] || []).map((h: string | number) => String(h ?? '').trim());
        const hi: Record<string, number> = {};
        for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
          const idx = findHeaderIndex(headers, aliases);
          if (idx >= 0) hi[key] = idx;
        }

        if (hi.shortName === undefined) {
          reject(new Error('模板缺少"简称"列，请下载最新模板'));
          return;
        }

        const s = (row: string[], key: string, fallback: number): string =>
          String(row[hi[key] ?? fallback] ?? '').trim();

        const items = rows.slice(1)
          .filter((row: string[]) => {
            const name = s(row, 'shortName', 1);
            return name !== '示例客户' && !name.includes('示例');
          })
          .map((row: string[]): ParsedRow => {
            const categoryGrades: Record<string, string> = {};
            categoryNames.forEach((cat: string) => {
              const aliases = [`${cat}等级`, `${cat}级别`, cat];
              const colIdx = findColumnByAlias(headers, aliases);
              categoryGrades[cat] = colIdx >= 0
                ? String(row[colIdx] ?? '').trim()
                : '';
            });
            return {
              customerCode: s(row, 'customerCode', 0),
              shortName: s(row, 'shortName', 1),
              paymentTerm: s(row, 'paymentTerm', 2),
              country: s(row, 'country', 3),
              salesChannel: s(row, 'salesChannel', 4),
              creditCondition: s(row, 'creditCondition', 5),
              region: s(row, 'region', 6),
              channelType: s(row, 'channelType', 7),
              categoryGrades,
            };
          });
        resolve(items);
      } catch (err) {
        if (err instanceof Error) { reject(err); return; }
        reject(new Error('Excel 文件解析失败'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}

function getGradeBadgeStyle(grade: string): { bg: string; text: string } | null {
  if (grade === 'S') return { bg: 'hsl(40, 85%, 55%)', text: '#fff' };
  if (grade === 'A') return { bg: 'hsl(210, 70%, 55%)', text: '#fff' };
  if (grade === 'B') return { bg: 'hsl(220, 10%, 60%)', text: '#fff' };
  return null;
}
interface FormState {
  customerCode: string; shortName: string; fullName: string;
  country: string; region: string;
  salesChannel: string; channelType: string;
  creditCondition: string; paymentTerm: string;
}

const EMPTY_FORM: FormState = {
  customerCode: '', shortName: '', fullName: '', country: '',
  region: '', salesChannel: '', channelType: '',
  creditCondition: '', paymentTerm: '',
};
const TABLE_HEADERS = [
  '客户编码', '简称', '国家', '区域', '销售渠道', '渠道类型', '信用条件', '品类等级', '操作',
];
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-muted-foreground">{label}</label>{children}</div>);
}
function FormSelect({ value, onChange, placeholder, options, disabled }: { value: string; onChange: (v: string) => void; placeholder: string; options: readonly string[]; disabled?: boolean }) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={disabled ? 'opacity-60' : ''}><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>{options.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
    </Select>
  );
}
const cellCls = 'px-3 py-2.5 text-foreground';

export default function CustomerPage() {
  const { hasRole, user } = useAppAuth();
  const isSuperAdmin = hasRole('super_admin');
  const [items, setItems] = useState<CustomerItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CustomerItem | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomerItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number; failed: number;
    errors: Array<{ row: number; message: string }>;
  } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formCategoryGrades, setFormCategoryGrades] = useState<Record<string, string>>({});
  const [allCategoryGrades, setAllCategoryGrades] = useState<Record<string, Record<string, string>>>({});
  const [categoryList, setCategoryList] = useState<ProductCategoryItem[]>([]);
  const [categoryNames, setCategoryNames] = useState<string[]>(PRODUCT_CATEGORIES.slice());

  const fetchCategories = useCallback(async () => {
    try {
      const list = await getProductCategories();
      const sorted = [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      setCategoryList(sorted);
      setCategoryNames(sorted.map((c: ProductCategoryItem) => c.name));
    } catch {
      setCategoryNames(PRODUCT_CATEGORIES.slice());
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCustomerList({ keyword: keyword || undefined, page, pageSize: PAGE_SIZE });
      setItems(result.items);
      setTotal(result.total);
      try {
        const gradesResults = await Promise.all(
          result.items.map(async (item: CustomerItem) => {
            try {
              const grades = await getCustomerCategoryGrades(item.id);
              return { id: item.id, grades };
            } catch {
              return { id: item.id, grades: [] };
            }
          }),
        );
        const gradesMap: Record<string, Record<string, string>> = {};
        for (const r of gradesResults) {
          const map: Record<string, string> = {};
          for (const g of r.grades) map[g.category] = g.grade;
          for (const cat of categoryNames) if (!map[cat]) map[cat] = '无';
          gradesMap[r.id] = map;
        }
        setAllCategoryGrades(gradesMap);
      } catch {
        // ignore grades fetch error
      }
    } catch {
      setError('加载失败，请刷新重试');
      toast.error('获取客户列表失败');
    } finally { setLoading(false); }
  }, [keyword, page]);
  useEffect(() => { fetchCategories(); fetchList(); }, [fetchCategories, fetchList]);
  const handleSearch = () => { setPage(1); fetchList(); };
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };
  const updateCategoryGrade = (cat: string, grade: string) => {
    setFormCategoryGrades((prev) => ({ ...prev, [cat]: grade }));
  };
  const openCreateDialog = () => {
    setEditingItem(null);
    const initialForm = { ...EMPTY_FORM };
    if (!isSuperAdmin && user?.region) {
      initialForm.region = user.region;
    }
    setForm(initialForm);
    const init: Record<string, string> = {};
    for (const cat of categoryNames) init[cat] = '';
    setFormCategoryGrades(init);
    setDialogOpen(true);
  };
  const openEditDialog = async (item: CustomerItem) => {
    setEditingItem(item);
    setForm({
      customerCode: item.customerCode || '', shortName: item.shortName,
      fullName: item.fullName, country: item.country,
      region: item.region,
      salesChannel: item.salesChannel || '', channelType: item.channelType,
      creditCondition: item.creditCondition,
      paymentTerm: item.paymentTerm || '',
    });
    try {
      const items = await getCustomerCategoryGrades(item.id);
      const gradeMap: Record<string, string> = {};
      if (items.length === 0) {
        for (const cat of categoryNames) gradeMap[cat] = item.grade || '无';
      } else {
        for (const g of items) gradeMap[g.category] = g.grade;
        for (const cat of categoryNames) if (!gradeMap[cat]) gradeMap[cat] = '无';
      }
      setFormCategoryGrades(gradeMap);
    } catch {
      const fallback: Record<string, string> = {};
      for (const cat of categoryNames) fallback[cat] = item.grade || '无';
      setFormCategoryGrades(fallback);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.shortName.trim()) { toast.error('请输入客户简称'); return; }
    const payload: CreateCustomerRequest = {
      shortName: form.shortName.trim(), fullName: form.fullName.trim(),
      country: form.country.trim(), region: form.region,
      channelType: form.channelType, creditCondition: form.creditCondition.trim(),
      grade: '', customerCode: form.customerCode.trim() || undefined,
      salesChannel: form.salesChannel,
      paymentTerm: form.paymentTerm.trim(),
    };
    setSaving(true);
    try {
      if (editingItem) {
        await updateCustomer(editingItem.id, payload);
        try { await updateCustomerCategoryGrades(editingItem.id, formCategoryGrades); }
        catch { toast.warning('品类等级保存失败，请稍后补录'); }
        toast.success('更新成功');
      } else {
        const created = await createCustomer(payload);
        if (created?.id) {
          try { await updateCustomerCategoryGrades(created.id, formCategoryGrades); }
          catch { toast.warning('品类等级保存失败，请稍后补录'); }
        }
        toast.success('创建成功');
      }
      setDialogOpen(false); fetchList();
    } catch (error: unknown) {
      const resp = (error as { response?: { data?: { message?: string } } })?.response;
      toast.error(resp?.data?.message || '操作失败');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCustomer(deleteTarget.id);
      toast.success('删除成功'); setDeleteTarget(null); fetchList();
    } catch { toast.error('删除失败'); }
    finally { setDeleting(false); }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImporting(true); setImportResult(null);
    try {
      const parsedItems = await parseCustomerExcel(file, categoryNames);
      if (parsedItems.length === 0) { toast.error('文件中没有可导入的数据'); setImporting(false); return; }
      let imported = 0; let failed = 0;
      const errors: Array<{ row: number; message: string }> = [];
      for (let i = 0; i < parsedItems.length; i++) {
        const item = parsedItems[i];
        if (!item.shortName) { failed++; errors.push({ row: i + 2, message: '简称为空，已跳过' }); continue; }
        try {
          const created = await createCustomer({
            shortName: item.shortName, fullName: item.shortName,
            country: item.country, region: item.region,
            channelType: item.channelType, creditCondition: item.creditCondition,
            grade: '', customerCode: item.customerCode || undefined,
            salesChannel: item.salesChannel,
            paymentTerm: item.paymentTerm,
          });
          const hasGrades = Object.values(item.categoryGrades).some((g: string) => g);
          if (hasGrades && created?.id) {
            try { await updateCustomerCategoryGrades(created.id, item.categoryGrades); }
            catch { logger.error('Category grades import failed for row', { row: i + 2 }); }
          }
          imported++;
        } catch (err: unknown) {
          failed++;
          const resp = (err as { response?: { data?: { message?: string } } })?.response;
          errors.push({ row: i + 2, message: resp?.data?.message || '创建失败' });
        }
      }
      const result = { imported, failed, errors };
      setImportResult(result);
      if (imported > 0) { toast.success(`成功导入 ${imported} 条数据`); fetchList(); }
      if (failed > 0 && imported === 0) toast.error('导入失败，请检查错误详情');
    } catch (error) { logger.error('Customer import failed', error); toast.error('文件解析或导入失败'); }
    finally { setImporting(false); }
  };

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleExport = async () => {
    try {
      const result = await getCustomerList({ keyword: keyword || undefined, page: 1, pageSize: 10000 });
      const exportRows = result.items.map((item: CustomerItem) => {
        const grades = allCategoryGrades[item.id] || {};
        const row: Record<string, string> = {
          '客户编码': item.customerCode || '',
          '简称': item.shortName,
          '全称': item.fullName || '',
          '收款条件': item.paymentTerm || '',
          '国家': item.country || '',
          '客户销售渠道': item.salesChannel || '',
          '信用条件': item.creditCondition || '',
          '所属区域': item.region || '',
          '客户渠道类型': item.channelType || '',
        };
        for (const cat of categoryNames) {
          row[`${cat}等级`] = grades[cat] || '无';
        }
        return row;
      });
      const headers = [
        '客户编码', '简称', '全称', '收款条件', '国家',
        '客户销售渠道', '信用条件', '所属区域', '客户渠道类型',
        ...categoryNames.map((c: string) => `${c}等级`),
      ];
      const ws = XLSX.utils.json_to_sheet(exportRows, { header: headers });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '客户数据');
      XLSX.writeFile(wb, '客户数据导出.xlsx');
      toast.success(`成功导出 ${exportRows.length} 条数据`);
    } catch {
      toast.error('导出失败');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-foreground">客户管理</h1>
          <div className="relative w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="搜索客户..."
              value={keyword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeyword(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={downloadCustomerTemplate} className="gap-1.5">
            <Download className="size-4" />下载模板
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
            <FileDown className="size-4" />导出
          </Button>
          <CanEdit>
            <Button variant="outline" size="sm" onClick={() => { setImportResult(null); setImportDialogOpen(true); }} className="gap-1.5">
              <Upload className="size-4" />批量导入
            </Button>
          </CanEdit>
          <CanEdit>
            <Button onClick={openCreateDialog} className="gap-1.5">
              <Plus className="size-4" />新建客户
            </Button>
          </CanEdit>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">加载中...</div>
        ) : error ? (
          <div className="flex items-center justify-center h-40 text-destructive text-sm">{error}</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">暂无数据</div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border border-border">
                <th className="border border-border bg-accent/50 px-2 py-2.5 w-[32px]" />
                {TABLE_HEADERS.map((header, i) => (
                  <th
                    key={header}
                    className={`border border-border bg-accent/50 px-3 py-2.5 text-xs font-medium text-muted-foreground ${
                      i === TABLE_HEADERS.length - 1 ? 'text-center w-[100px]' : 'text-left'
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item: CustomerItem) => {
                const isExpanded = expandedId === item.id;
                return (
                  <Fragment key={item.id}>
                    <tr className="border-x border-b border-border hover:bg-accent/30 transition-colors">
                      <td className="px-2 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => toggleExpand(item.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                        </button>
                      </td>
                      <td className={`${cellCls} font-mono text-xs`}>{item.customerCode || '—'}</td>
                      <td className={`${cellCls} font-medium`}>{item.shortName}</td>
                      <td className={cellCls}>{item.country}</td>
                      <td className={cellCls}>{item.region}</td>
                      <td className={cellCls}>{item.salesChannel || '—'}</td>
                      <td className={cellCls}>{item.channelType}</td>
                      <td className={cellCls}>{item.creditCondition}</td>
                      <td className="px-3 py-2.5 text-foreground">
                        {(() => {
                          const grades = allCategoryGrades[item.id];
                          if (!grades) return <span className="text-muted-foreground">—</span>;
                          const entries = categoryNames.filter((c: string) => grades[c] && grades[c] !== '无')
                            .map((c: string) => ({ cat: c, grade: grades[c] }));
                          const show = entries.slice(0, 3);
                          if (show.length === 0) return <span className="text-muted-foreground">—</span>;
                          return (
                            <div className="flex flex-wrap gap-1">
                              {show.map(({ cat, grade }: { cat: string; grade: string }) => {
                                const style = getGradeBadgeStyle(grade);
                                return (
                                  <span key={cat} className="inline-flex items-center px-1.5 py-0.5 text-xs rounded-sm"
                                    style={style ? { backgroundColor: style.bg, color: style.text } : undefined}>
                                    {cat}:{grade}
                                  </span>
                                );
                              })}
                              {entries.length > 3 && (
                                <span className="text-xs text-muted-foreground self-center">...</span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <CanEdit>
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}
                              className="h-7 px-2 text-muted-foreground hover:text-foreground">
                              <Pencil className="size-3.5" />
                            </Button>
                          </CanEdit>
                          <CanEdit>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(item)}
                              className="h-7 px-2 text-muted-foreground hover:text-destructive">
                              <Trash2 className="size-3.5" />
                            </Button>
                          </CanEdit>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={TABLE_HEADERS.length + 1} className="px-6 py-4 bg-accent/10">
                          <CustomerCategoryGrades customerId={item.id} defaultGrade={item.grade} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between border-t border-border px-6 py-3">
          <span className="text-xs text-muted-foreground">
            共 <span className="font-mono tabular-nums">{total}</span> 条
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>上一页</Button>
            <span className="px-3 text-xs font-mono tabular-nums text-muted-foreground">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>下一页</Button>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? '编辑客户' : '新建客户'}</DialogTitle>
            <DialogDescription>{editingItem ? '修改客户信息' : '添加新的客户记录'}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <FormField label="客户编码"><Input value={editingItem ? form.customerCode : ''} readOnly placeholder={editingItem ? '' : '自动生成'} className="bg-muted" /></FormField>
            <FormField label="客户简称 *"><Input value={form.shortName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('shortName', e.target.value)} placeholder="请输入客户简称" /></FormField>
            <FormField label="客户全称 *"><Input value={form.fullName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('fullName', e.target.value)} placeholder="请输入客户全称" /></FormField>
            <FormField label="国家 *"><Input value={form.country} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('country', e.target.value)} placeholder="请输入国家" /></FormField>
            <FormField label="区域 *">
              <FormSelect value={form.region} onChange={(v: string) => updateField('region', v)} placeholder="请选择区域" options={REGION_OPTIONS} disabled={!isSuperAdmin} />
              {!isSuperAdmin && <span className="text-[10px] text-muted-foreground">仅超管可修改</span>}
            </FormField>
            <FormField label="销售渠道 *"><FormSelect value={form.salesChannel} onChange={(v: string) => updateField('salesChannel', v)} placeholder="请选择销售渠道" options={SALES_CHANNEL_OPTIONS} /></FormField>
            <FormField label="渠道类型 *"><FormSelect value={form.channelType} onChange={(v: string) => updateField('channelType', v)} placeholder="请选择渠道类型" options={CHANNEL_TYPE_OPTIONS} /></FormField>
            <FormField label="信用条件 *"><Input value={form.creditCondition} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('creditCondition', e.target.value)} placeholder="请输入信用条件" /></FormField>
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">收款条件</label>
              <Textarea value={form.paymentTerm} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateField('paymentTerm', e.target.value)} placeholder="请输入收款条件" rows={2} />
            </div>
          </div>
          <div className="border-t border-border pt-4 mt-2">
            <h3 className="text-sm font-medium text-foreground mb-3">品类等级配置</h3>
            {!isSuperAdmin && (
              <p className="text-xs text-muted-foreground mb-2">品类等级仅超管可编辑</p>
            )}
            <div className="grid grid-cols-3 gap-x-4 gap-y-2">
              {categoryNames.map((cat: string) => (
                <div key={cat} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap min-w-[88px]">{cat}</span>
                  <Select value={formCategoryGrades[cat] || ''} onValueChange={(v: string) => updateCategoryGrade(cat, v)} disabled={!isSuperAdmin}>
                    <SelectTrigger className={`h-8 flex-1 ${!isSuperAdmin ? 'opacity-60' : ''}`}><SelectValue placeholder="选择" /></SelectTrigger>
                    <SelectContent>
                      {GRADE_OPTIONS.map((g: string) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除客户「{deleteTarget?.shortName}」吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90">
              {deleting ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>批量导入客户</DialogTitle>
            <DialogDescription>请选择 Excel 文件（.xlsx），格式参考下载模板（19列）</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-sm p-8">
              {importing ? (
                <div className="text-sm text-muted-foreground">正在解析并导入数据...</div>
              ) : (
                <>
                  <Upload className="size-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">点击选择或拖拽 Excel 文件到此处</p>
                  <label>
                    <input type="file" accept=".xlsx,.xls" onChange={handleImportFile} className="hidden" />
                    <Button variant="outline" size="sm" onClick={(e) => { (e.currentTarget.previousElementSibling as HTMLInputElement)?.click(); }} asChild>
                      <span>选择文件</span>
                    </Button>
                  </label>
                </>
              )}
            </div>
            {importResult && (
              <div className="space-y-2">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-foreground">
                    成功导入：<span className="font-mono font-medium text-emerald-600">{importResult.imported}</span> 条
                  </span>
                  {importResult.failed > 0 && (
                    <span className="text-foreground">
                      失败：<span className="font-mono font-medium text-destructive">{importResult.failed}</span> 条
                    </span>
                  )}
                </div>
                {importResult.errors.length > 0 && (
                  <div className="max-h-[200px] overflow-auto border border-border rounded-sm">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-accent/50">
                          <th className="border border-border px-3 py-1.5 text-left font-medium text-muted-foreground w-[60px]">行号</th>
                          <th className="border border-border px-3 py-1.5 text-left font-medium text-muted-foreground">错误原因</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.errors.map((err: { row: number; message: string }, idx: number) => (
                          <tr key={idx} className="border-x border-b border-border">
                            <td className="px-3 py-1.5 font-mono text-muted-foreground">{err.row}</td>
                            <td className="px-3 py-1.5 text-destructive">{err.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
