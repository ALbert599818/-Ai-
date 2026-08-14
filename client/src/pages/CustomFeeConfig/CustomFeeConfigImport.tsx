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
import { importCustomFeeConfigs } from '@client/src/api/custom-fee-config';
import type { ImportCustomFeeConfigResponse } from '@shared/custom-fee-config';
import CanEdit from '@client/src/components/CanEdit';

const TEMPLATE_HEADERS = ['定制项名称'];

interface CustomFeeConfigImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    TEMPLATE_HEADERS,
    ['定制项A'],
    ['定制项B'],
  ]);
  XLSX.utils.book_append_sheet(wb, ws, '定制项名称');
  XLSX.writeFile(wb, '定制项名称导入模板.xlsx');
}

function parseExcelFile(
  file: File,
): Promise<Array<{ name: string }>> {
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
        const nameIdx = headerRow.indexOf('定制项名称');

        if (nameIdx < 0) {
          reject(new Error('模板缺少必要列：定制项名称'));
          return;
        }

        const items = rows.slice(1).map((row: string[]) => ({
          name: String(row[nameIdx] ?? '').trim(),
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

export default function CustomFeeConfigImport({
  open,
  onOpenChange,
  onSuccess,
}: CustomFeeConfigImportProps) {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] =
    useState<ImportCustomFeeConfigResponse | null>(null);

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

      const result = await importCustomFeeConfigs(parsedItems);
      setImportResult(result);
      if (result.imported > 0) {
        toast.success(`成功导入 ${result.imported} 条数据`);
        onSuccess();
      }
      if (result.failed > 0 && result.imported === 0) {
        toast.error('导入失败，请检查错误详情');
      }
      if (result.skipped > 0 && result.failed === 0 && result.imported === 0) {
        toast.info('所有定制项名称均已存在，无需导入');
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
            <DialogTitle>批量导入定制项名称</DialogTitle>
            <DialogDescription>
              请选择 Excel 文件（.xlsx），第一列为定制项名称，已存在的名称将自动跳过
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
                  {importResult.skipped > 0 && (
                    <span className="text-foreground">
                      跳过（已存在）：
                      <span className="font-mono font-medium text-amber-600">
                        {importResult.skipped}
                      </span>{' '}
                      条
                    </span>
                  )}
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
                            错误信息
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.errors.map(
                          (
                            err: { row: number; message: string },
                            idx: number,
                          ) => (
                            <tr
                              key={idx}
                              className="border-x border-b border-border"
                            >
                              <td className="px-3 py-1.5 text-muted-foreground">
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
