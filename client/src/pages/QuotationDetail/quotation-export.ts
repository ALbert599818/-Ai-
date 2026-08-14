import * as XLSX from 'xlsx';
import type { QuotationDetailResponse } from '@shared/quotation';

export function exportQuotationToExcel(detail: QuotationDetailResponse): void {
  const wb = XLSX.utils.book_new();

  const headerRows: string[][] = [
    ['报价单号', detail.quotationNo],
    ['状态', formatStatus(detail.status)],
    ['客户简称', detail.customerShortName],
    ['客户全称', detail.customerFullName],
    ['国家', detail.country],
    ['区域', detail.region],
    ['渠道类型', detail.channelType],
    ['客户等级', detail.grade],
    ['是否新客户', detail.isNewCustomer ? '是' : '否'],
    ['创建人', detail.createdByName],
    ['创建时间', detail.createdAt],
    ['总金额', String(detail.totalAmount)],
  ];
  if (detail.status === 'rejected' && detail.rejectReason) {
    headerRows.push(['驳回原因', detail.rejectReason]);
  }
  headerRows.push(
    ['', ''],
    ['— 系数快照 —', ''],
    ['客户等级系数', String(detail.gradeCoefficient)],
    ['价格敏感度系数', String(detail.sensitivityCoefficient)],
    ['信用条件', detail.creditCondition],
    ['信用条件系数', String(detail.creditCoefficient)],
    ['保险系数', String(detail.insuranceCoefficient)],
    ['物流类型', detail.logisticsType],
    ['物流系数', String(detail.logisticsCoefficient)],
    ['汇率风险率', pct(detail.exchangeRiskRate)],
    ['售后准备金率', pct(detail.afterSalesRate)],
    ['超额营销费用率', pct(detail.marketingExpenseRate)],
    ['数量系数', String(detail.quantityCoefficient)],
    ['弹性备用金', String(detail.flexibleReserve)],
    ['弹性备用金类型', detail.flexibleIsRate ? '费率' : '固定金额'],
  );
  const wsInfo = XLSX.utils.aoa_to_sheet(headerRows);
  wsInfo['!cols'] = [{ wch: 14 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsInfo, '报价单信息');

  const itemHeader = [
    '型号', '颜色', '品类', '产品级别', '采购成本', '研发费用',
    'MOQ', '数量', '目标毛利率', '单价', '总价', '实际毛利率', '告警级别', '告警信息',
  ];
  const itemRows = detail.items.map((item) => [
    item.model, item.color, item.category, item.productGrade,
    item.purchaseCost, item.rdCost, item.moq, item.quantity,
    pct(item.targetMargin), item.unitPrice, item.totalPrice,
    pct(item.actualMargin), item.alertLevel, item.alertMsg,
  ]);
  const wsItems = XLSX.utils.aoa_to_sheet([itemHeader, ...itemRows]);
  wsItems['!cols'] = itemHeader.map(() => ({ wch: 14 }));
  XLSX.utils.book_append_sheet(wb, wsItems, '报价行项目');

  if (detail.customFees.length > 0) {
    const feeHeader = ['费用名称', '金额'];
    const feeRows = detail.customFees.map((f) => [f.feeName, f.feeAmount]);
    const wsFees = XLSX.utils.aoa_to_sheet([feeHeader, ...feeRows]);
    wsFees['!cols'] = [{ wch: 20 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsFees, '定制费用');
  }

  const summaryHeader: string[][] = [
    ['售后准备金小计', String(detail.afterSalesSubtotal)],
    ['超额营销费用小计', String(detail.marketingSubtotal)],
    ['税率', pct(detail.taxRate)],
    ['总金额', String(detail.totalAmount)],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryHeader);
  wsSummary['!cols'] = [{ wch: 18 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, '汇总信息');

  XLSX.writeFile(wb, `报价单_${detail.quotationNo}.xlsx`);
}

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    draft: '草稿',
    submitted: '已提交',
    approved: '已审批',
    rejected: '已驳回',
  };
  return map[status] || status;
}

function pct(v: number): string {
  return `${(v * 100).toFixed(2)}%`;
}
