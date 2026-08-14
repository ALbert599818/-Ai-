import { useState } from 'react';
import { Upload } from 'lucide-react';
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
import { importProducts } from '@client/src/api/product';

const REQUIRED_TEMPLATE_HEADERS = [
  '型号',
  '颜色',
  'MOQ',
];

const HEADER_ALIASES: Record<string, string[]> = {
  model: ['型号', '产品型号', '产品名称', '型号编码'],
  color: ['颜色', '商品颜色', '色彩'],
  category: ['品类', '商品品类', '分类'],
  erpCategory: ['ERP品类', 'erp品类', 'ERP分类'],
  productGrade: ['产品级别', '产品等级', '级别'],
  purchaseCost: [
    '采购价格',
    '成本单价',
    '采购成本',
    '单价',
    '采购价',
    '采购价格(元)',
    '产品物料采购成本',
  ],
  rdCost: ['研发成本', '研发费', '研发费用', '研发费用成本'],
  moq: ['MOQ', 'moq', '起订量', '最小起订量', '最小订购量'],
};

function buildHeaderIndex(
  headerRow: string[],
): Record<string, number> {
  const index: Record<string, number> = {};
  headerRow.forEach((raw, i) => {
    const cell = String(raw ?? '').trim();
    if (!cell) return;
    for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.includes(cell) && index[key] === undefined) {
        index[key] = i;
        break;
      }
    }
  });
  return index;
}

function parseExcelFile(
  file: File,
): Promise<
  Array<{
    model: string;
    color: string;
    purchaseCost: string;
    moq: number;
    category: string;
    erpCategory: string;
    productGrade: string;
    rdCost: string;
  }>
> {
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
        const rows: string[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
        });

        if (rows.length < 2) {
          reject(new Error('Excel 文件中没有数据行'));
          return;
        }

        const headerRow = rows[0] || [];
        const headerIndex = buildHeaderIndex(headerRow);

        for (const required of REQUIRED_TEMPLATE_HEADERS) {
          const matchedKey = Object.keys(HEADER_ALIASES).find(
            (k) => HEADER_ALIASES[k]?.includes(required),
          );
          if (
            !matchedKey ||
            headerIndex[matchedKey] === undefined
          ) {
            const detectedCols = headerRow
              .map((h) => String(h ?? '').trim())
              .filter(Boolean)
              .join('、');
            reject(
              new Error(
                `模板缺少必要列「${required}」。检测到列名：${
                  detectedCols || '(空)'
                }，请下载最新模板后重新填写`,
              ),
            );
            return;
          }
        }

        const pick = (
          row: string[],
          key: string,
        ): string => {
          const idx = headerIndex[key];
          if (idx === undefined) return '';
          const cell = row[idx];
          return cell === undefined || cell === null
            ? ''
            : String(cell).trim();
        };

        const modelIdx = headerIndex.model ?? 1;
        const items = rows.slice(1)
          .filter((row: string[]) => {
            const model = String(row[modelIdx] ?? '').trim();
            return model !== 'AUDIO-01' && !model.includes('示例');
          })
          .map((row: string[]) => ({
          model: pick(row, 'model'),
          color: pick(row, 'color'),
          category: pick(row, 'category'),
          erpCategory: pick(row, 'erpCategory'),
          productGrade: pick(row, 'productGrade'),
          purchaseCost: pick(row, 'purchaseCost') || '0',
          rdCost: pick(row, 'rdCost'),
          moq: Number(pick(row, 'moq') || 0),
        }));

        resolve(items);
      } catch (err) {
        if (err instanceof Error) {
          reject(err);
          return;
        }
        reject(new Error('Excel 文件解析失败'));
      }
    };
    reader.onerror = () =>
      reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}

interface ProductImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
}

export function ProductImportDialog({
  open,
  onOpenChange,
  onImportSuccess,
}: ProductImportDialogProps) {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    failed: number;
    errors: Array<{ row: number; message: string }>;
  } | null>(null);

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
      const result = await importProducts(parsedItems);
      setImportResult(result);
      if (result.imported > 0) {
        toast.success(
          `成功导入 ${result.imported} 条数据`,
        );
        onImportSuccess();
      }
      if (result.failed > 0 && result.imported === 0) {
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
    if (!nextOpen) setImportResult(null);
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-sm max-w-lg">
        <DialogHeader>
          <DialogTitle>批量导入商品</DialogTitle>
          <DialogDescription>
            请选择 Excel 文件（.xlsx），格式参考下载模板
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
                  成功导入：
                  <span className="font-mono font-medium text-emerald-600">
                    {importResult.imported}
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
  );
}
