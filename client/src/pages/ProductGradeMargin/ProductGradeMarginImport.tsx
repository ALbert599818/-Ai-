import { useState } from 'react';
import { Upload, Download } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import { toast } from 'sonner';
import { logger } from '@/lib/lark-shim/logger';
import * as XLSX from 'xlsx';
import { importProductGradeMargins } from '@client/src/api/product-grade-margin';
import type { ImportProductGradeMarginResponse } from '@shared/product-grade-margin';
import CanEdit from '@client/src/components/CanEdit';

const TEMPLATE_HEADERS = [
  '品类',
  '产品等级',
  '目标毛利率',
  '毛利率红线',
  '销售占比',
  '毛利贡献率',
];

const REQUIRED_TEMPLATE_HEADERS = [
  '品类',
  '产品等级',
  '目标毛利率',
];

const HEADER_ALIASES: Record<string, string[]> = {
  category: ['品类', 'ERP品类'],
  productGrade: [
    '产品等级',
    '产品级别',
    '客户级别',
    '客户等级',
    '级别',
    '等级',
  ],
  targetMargin: ['目标毛利率', '毛利率目标'],
  marginRedline: ['毛利率红线', '毛利红线'],
  salesRatio: ['销售占比'],
  marginContribution: ['毛利贡献率', '毛利贡献'],
};

function buildHeaderIndex(
  headerRow: string[],
): Record<string, number> {
  const index: Record<string, number> = {};
  const normalized = headerRow.map((h) =>
    String(h ?? '').trim(),
  );
  for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
    for (const alias of aliases) {
      const idx = normalized.indexOf(alias);
      if (idx >= 0) {
        index[key] = idx;
        break;
      }
    }
  }
  return index;
}

interface ProductGradeMarginImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    TEMPLATE_HEADERS,
    ['音频-耳机', 'S', '0.45', '0.30', '0.35', '0.30'],
    ['音频-耳机', 'A', '0.38', '0.25', '0.40', '0.28'],
    ['PC-游戏耳机', 'S', '0.42', '0.28', '0.30', '0.32'],
    ['移动', 'B', '0.30', '0.20', '0.25', '0.22'],
    [],
    ['说明：'],
    ['1. 品类：必填，如 音频-耳机、PC-游戏耳机、移动 等'],
    ['2. 产品等级：必填，可选 S / A / B / C / D'],
    ['3. 目标毛利率：必填，小数，0.45 表示 45%'],
    ['4. 毛利率红线 / 销售占比 / 毛利贡献率：小数，如 0.30 表示 30%'],
  ]);
  ws['!cols'] = [
    { wch: 16 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '产品品级及毛利率');
  XLSX.writeFile(wb, '新品毛利率目标导入模板.xlsx');
}

export type ParsedImportResult = Array<{
  category: string;
  productGrade: string;
  targetMargin: string;
  marginRedline: string;
  salesRatio: string;
  marginContribution: string;
}> & { missingHeaders?: string[] };

function parseExcelFile(
  file: File,
): Promise<ParsedImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(
          e.target?.result as ArrayBuffer,
        );
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          reject(new Error('Excel 文件中没有工作表'));
          return;
        }
        const sheet = workbook.Sheets[sheetName];
        const rows: string[][] = XLSX.utils.sheet_to_json(
          sheet,
          { header: 1, defval: '' },
        );

        if (rows.length < 2) {
          reject(new Error('Excel 文件中没有数据行'));
          return;
        }

        const headerRow = rows[0] || [];
        const headerIndex = buildHeaderIndex(headerRow);

        const pick = (row: string[], key: string): string => {
          const idx = headerIndex[key];
          if (idx === undefined) return '';
          const cell = row[idx];
          return cell === undefined || cell === null
            ? ''
            : String(cell).trim();
        };

        const missingHeaders: string[] = [];
        for (const required of REQUIRED_TEMPLATE_HEADERS) {
          const matchedKey = Object.keys(HEADER_ALIASES).find(
            (k) => HEADER_ALIASES[k]?.includes(required),
          );
          if (
            !matchedKey ||
            headerIndex[matchedKey] === undefined
          ) {
            missingHeaders.push(required);
          }
        }

        const items = rows.slice(1).map((row: string[]) => ({
          category: pick(row, 'category'),
          productGrade: pick(row, 'productGrade'),
          targetMargin: pick(row, 'targetMargin'),
          marginRedline: pick(row, 'marginRedline'),
          salesRatio: pick(row, 'salesRatio'),
          marginContribution: pick(row, 'marginContribution'),
        })) as ParsedImportResult;
        items.missingHeaders = missingHeaders;

        resolve(items);
      } catch {
        reject(new Error('Excel 文件解析失败'));
      }
    };
    reader.onerror = () =>
      reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}

export default function ProductGradeMarginImport({
  open,
  onOpenChange,
  onSuccess,
}: ProductGradeMarginImportProps) {
  const [importing, setImporting] = useState(false);
  const [
    importResult,
    setImportResult,
  ] = useState<ImportProductGradeMarginResponse | null>(null);

  const handleImportFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setImporting(true);
    setImportResult(null);
    try {
      const parsedItems = await parseExcelFile(file);
      if (parsedItems.length === 0) {
        toast.error('文件中没有可导入的数据');
        setImporting(false);
        return;
      }

      if (parsedItems.missingHeaders?.length) {
        toast.warning(
          `模板未检测到列「${parsedItems.missingHeaders.join('、')}」，相关字段将导入为空`,
        );
      }

      const result = await importProductGradeMargins(
        parsedItems,
      );
      setImportResult(result);
      if (result.imported > 0 || result.updated > 0) {
        toast.success(
          `成功新增 ${result.imported} 条，更新 ${result.updated} 条`,
        );
        onSuccess();
      }
      if (
        result.failed > 0 &&
        result.imported === 0 &&
        result.updated === 0
      ) {
        toast.error('导入失败，请检查错误详情');
      }
    } catch (error) {
      logger.error('Import failed', error);
      toast.error('文件解析或导入失败');
    } finally {
      setImporting(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setImportResult(null);
    }
    onOpenChange(nextOpen);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={downloadTemplate}
        className="gap-1.5"
      >
        <Download className="size-4" />
        下载模板
      </Button>
      <CanEdit>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenChange(true)}
          className="gap-1.5"
        >
          <Upload className="size-4" />
          批量导入
        </Button>
      </CanEdit>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="rounded-sm max-w-lg">
          <DialogHeader>
            <DialogTitle>
              批量导入产品品级及毛利率
            </DialogTitle>
            <DialogDescription>
              请选择 Excel 文件（.xlsx），已存在的品类+产品等级组合将被更新，格式参考下载模板
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-sm p-8">
              {importing ? (
                <div className="text-sm text-muted-foreground">
                  正在解析并导入数据...
                </div>
              ) : (
                <>
                  <Upload className="size-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">
                    点击选择或拖拽 Excel 文件到此处
                  </p>
                  <label>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleImportFile}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        const input = (
                          e.currentTarget
                            .previousElementSibling as HTMLInputElement
                        );
                        input?.click();
                      }}
                      asChild
                    >
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
                    新增：
                    <span className="font-mono font-medium text-emerald-600">
                      {importResult.imported}
                    </span>{' '}
                    条
                  </span>
                  <span className="text-foreground">
                    更新：
                    <span className="font-mono font-medium text-primary">
                      {importResult.updated}
                    </span>{' '}
                    条
                  </span>
                  {importResult.failed > 0 && (
                    <span className="text-foreground">
                      失败：
                      <span className="font-mono font-medium text-destructive">
                        {importResult.failed}
                      </span>{' '}
                      条
                    </span>
                  )}
                </div>
                {importResult.errors.length > 0 && (
                  <div className="max-h-[200px] overflow-auto border border-border rounded-sm">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-accent/50">
                          <th className="border border-border px-3 py-1.5 text-left font-medium text-muted-foreground w-[60px]">
                            行号
                          </th>
                          <th className="border border-border px-3 py-1.5 text-left font-medium text-muted-foreground">
                            错误原因
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.errors.map(
                          (
                            err: {
                              row: number;
                              message: string;
                            },
                            idx: number,
                          ) => (
                            <tr
                              key={idx}
                              className="border-x border-b border-border"
                            >
                              <td className="px-3 py-1.5 font-mono text-muted-foreground">
                                {err.row}
                              </td>
                              <td className="px-3 py-1.5 text-destructive">
                                {err.message}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
