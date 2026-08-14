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
import { importExcessMarketing } from '@client/src/api/data-import';
import type { ImportResult } from '@client/src/api/data-import';
import CanEdit from '@client/src/components/CanEdit';

const TEMPLATE_HEADERS = ['客户简称', '超额营销费用率'];

interface ExcessMarketingImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    TEMPLATE_HEADERS,
    ['客户A', 0.02],
    ['客户B', 0.03],
  ]);
  XLSX.utils.book_append_sheet(wb, ws, '超额营销费用率');
  XLSX.writeFile(wb, '超额营销费用率导入模板.xlsx');
}

function parseExcelFile(
  file: File,
): Promise<Array<{ customerShortName: string; rate: string }>> {
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
        const nameIdx = headerRow.indexOf('客户简称');
        const rateIdx = headerRow.indexOf('超额营销费用率');

        if (nameIdx < 0 || rateIdx < 0) {
          reject(new Error('模板缺少必要列：客户简称、超额营销费用率'));
          return;
        }

        const items = rows.slice(1).map((row: string[]) => ({
          customerShortName: String(row[nameIdx] ?? '').trim(),
          rate: String(row[rateIdx] ?? '').trim(),
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

export default function ExcessMarketingImport({
  open,
  onOpenChange,
  onSuccess,
}: ExcessMarketingImportProps) {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] =
    useState<ImportResult | null>(null);

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

      const blob = new Blob(
        [JSON.stringify(parsedItems)],
        { type: 'application/json' },
      );
      const importFile = new File(
        [blob],
        'import.json',
        { type: 'application/json' },
      );

      const result = await importExcessMarketing(importFile);
      setImportResult(result);
      if (result.success > 0) {
        toast.success(`成功导入 ${result.success} 条数据`);
        onSuccess();
      }
      if (result.failed > 0 && result.success === 0) {
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
            <DialogTitle>批量导入超额营销费用率</DialogTitle>
            <DialogDescription>
              请选择 Excel 文件（.xlsx），已存在的客户简称将被更新
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
                    成功：
                    <span className="font-mono font-medium text-emerald-600">
                      {importResult.success}
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
                          <th className="border border-border px-3 py-1.5 text-left font-medium text-muted-foreground">
                            错误信息
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.errors.map(
                          (err: string, idx: number) => (
                            <tr
                              key={idx}
                              className="border-x border-b border-border"
                            >
                              <td className="px-3 py-1.5 text-destructive">
                                {err}
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
