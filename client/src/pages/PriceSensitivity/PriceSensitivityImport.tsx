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
import { importPriceSensitivities } from '@client/src/api/price-sensitivity';
import type { ImportPriceSensitivityResponse } from '@shared/price-sensitivity';
import CanEdit from '@client/src/components/CanEdit';

const TEMPLATE_HEADERS = ['区域', '渠道类型', '折扣值'];

interface PriceSensitivityImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    TEMPLATE_HEADERS,
    ['欧美', 'B2C', 0.95],
    ['欧美', 'B2B', 0.90],
    ['澳新日韩', '线下', 0.92],
  ]);
  XLSX.utils.book_append_sheet(wb, ws, '价格敏感系数');
  XLSX.writeFile(wb, '价格敏感系数导入模板.xlsx');
}

function parseExcelFile(
  file: File,
): Promise<Array<{ region: string; channelType: string; discount: string }>> {
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

        const headerRow = (rows[0] || []).map((h: string) =>
          String(h ?? '').trim(),
        );
        const regionIdx = headerRow.indexOf('区域');
        const channelTypeIdx = headerRow.indexOf('渠道类型');
        const discountIdx = headerRow.indexOf('折扣值');

        if (regionIdx < 0 || channelTypeIdx < 0 || discountIdx < 0) {
          reject(new Error('模板缺少必要列：区域、渠道类型、折扣值'));
          return;
        }

        const items = rows.slice(1).map((row: string[]) => ({
          region: String(row[regionIdx] ?? '').trim(),
          channelType: String(row[channelTypeIdx] ?? '').trim(),
          discount: String(row[discountIdx] ?? '').trim(),
        }));

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

export default function PriceSensitivityImport({
  open,
  onOpenChange,
  onSuccess,
}: PriceSensitivityImportProps) {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] =
    useState<ImportPriceSensitivityResponse | null>(null);

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

      const result = await importPriceSensitivities(parsedItems);
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
            <DialogTitle>批量导入价格敏感系数</DialogTitle>
            <DialogDescription>
              请选择 Excel 文件（.xlsx），已存在的区域+渠道类型组合将被更新折扣值
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
