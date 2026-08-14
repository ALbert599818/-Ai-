import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';

const TEMPLATE_HEADERS: string[] = [
  '产品型号',
  '商品颜色',
  '数量',
  '物流类型',
  '灵活准备金（%）',
  '灵活准备金（元）',
  '灵活准备金模式',
  '费用1项目',
  '费用1内容',
  '费用1金额',
  '费用2项目',
  '费用2内容',
  '费用2金额',
  '费用3项目',
  '费用3内容',
  '费用3金额',
];

const EXAMPLE_ROW: (string | number)[] = [
  'AUDIO-01',
  '黑色',
  1000,
  '散货',
  2,
  0,
  '按比率',
  '开模',
  '彩盒模具',
  5000,
  '验货',
  '首件验货',
  800,
  '返工',
  '包装返工',
  300,
];

function downloadTemplate(): void {
  const wb = XLSX.utils.book_new();
  const wsData: (string | number)[][] = [
    TEMPLATE_HEADERS,
    EXAMPLE_ROW,
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = TEMPLATE_HEADERS.map((h: string) => ({
    wch: Math.max(h.length * 2, 12),
  }));

  XLSX.utils.book_append_sheet(wb, ws, '报价模板');
  XLSX.writeFile(wb, '报价模板.xlsx');
}

const QuotationTemplateDownload = () => {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={downloadTemplate}
      className="gap-1 rounded-sm text-xs"
    >
      <Download className="size-3.5" />
      下载模板
    </Button>
  );
};

export { downloadTemplate, TEMPLATE_HEADERS, EXAMPLE_ROW };
export default QuotationTemplateDownload;
