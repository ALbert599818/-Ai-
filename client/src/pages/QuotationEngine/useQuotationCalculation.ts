import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/lark-shim/logger';
import { calculateQuotation } from '@client/src/api/quotation';
import type { QuotationCalculateRequest } from '@shared/quotation';
import type {
  QuotationResult,
  QuotationItemResult,
} from './QuotationEngineSummary';
import type { ProductRow } from './StepProduct';

const EMPTY_RESULT: QuotationResult = {
  items: [],
  basePrice: 0,
  comprehensiveCoefficient: 0,
  totalQuantity: 0,
  subtotal: 0,
  feesTotal: 0,
  total: 0,
  alertLevel: 'none',
  alertMsg: '',
  actualMargin: 0,
  targetMargin: 0,
  afterSalesRate: 0,
  marketingExpenseRate: 0,
};

interface UseQuotationCalculationReturn {
  result: QuotationResult;
  calculating: boolean;
}

export function useQuotationCalculation(
  calculateRequest: QuotationCalculateRequest | null,
  setProductRows: React.Dispatch<React.SetStateAction<ProductRow[]>>,
): UseQuotationCalculationReturn {
  const [result, setResult] = useState<QuotationResult>(EMPTY_RESULT);
  const [calculating, setCalculating] = useState(false);
  const lastAlertLevel = useRef<'none' | 'yellow' | 'red'>('none');
  const lastRequestSig = useRef<string>('');

  useEffect(() => {
    if (!calculateRequest) {
      setResult(EMPTY_RESULT);
      lastAlertLevel.current = 'none';
      lastRequestSig.current = '';
      return;
    }

    const sig = JSON.stringify(calculateRequest);
    if (sig === lastRequestSig.current) {
      return;
    }
    lastRequestSig.current = sig;

    const timer = setTimeout(async () => {
      setCalculating(true);
      try {
        const resp = await calculateQuotation(calculateRequest);

        // Use backend kTotal directly from each item
        const kTotal = resp.items.length > 0
          ? (resp.items[0].kTotal ?? 0)
          : 0;

        const itemResults: QuotationItemResult[] = resp.items.map(
          (item) => ({
            model: item.model,
            color: item.color,
            quantity: item.quantity,
            basePrice: item.purchaseCost + item.rdCost,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            actualMargin: item.actualMargin,
            targetMargin: item.targetMargin,
            alertLevel: item.alertLevel,
            alertMsg: item.alertMsg,
            logisticsCoefficient: item.logisticsCoefficient ?? 0,
            flexibleReserveAmount: item.flexibleReserveAmount ?? 0,
            customFeesTotal: item.customFeesTotal ?? 0,
          }),
        );

        // Build a map keyed by model+color for reliable matching
        const calcMap = new Map<string, typeof resp.items[number]>();
        for (const item of resp.items) {
          calcMap.set(`${item.model}||${item.color}`, item);
        }

        // Update product rows with calculated values
        setProductRows((prev: ProductRow[]) => {
          return prev.map((row: ProductRow) => {
            if (!row.model || !row.color || row.quantity <= 0) return row;
            const calcItem = calcMap.get(`${row.model}||${row.color}`);
            if (!calcItem) return row;
            return {
              ...row,
              moq: calcItem.moq || row.moq,
              basePrice: calcItem.purchaseCost + calcItem.rdCost,
              unitPrice: calcItem.unitPrice,
              totalPrice: calcItem.totalPrice,
              actualMargin: calcItem.actualMargin,
              alertLevel: calcItem.alertLevel,
              alertMsg: calcItem.alertMsg,
              logisticsCoefficient: calcItem.logisticsCoefficient ?? 0,
              flexibleReserveAmount: calcItem.flexibleReserveAmount ?? 0,
              customFeesTotal: calcItem.customFeesTotal ?? 0,
            };
          });
        });

        // Compute aggregates
        const totalQuantity: number = itemResults.reduce(
          (s: number, i: QuotationItemResult) => s + i.quantity,
          0,
        );
        const subtotal: number = itemResults.reduce(
          (s: number, i: QuotationItemResult) => s + i.totalPrice,
          0,
        );
        const basePriceSum: number = itemResults.reduce(
          (s: number, i: QuotationItemResult) => s + i.basePrice,
          0,
        );
        const feesTotal: number = itemResults.reduce(
          (s: number, i: QuotationItemResult) => s + (i.customFeesTotal ?? 0),
          0,
        );

        const hasRed: boolean = itemResults.some(
          (i: QuotationItemResult) => i.alertLevel === 'red',
        );
        const hasYellow: boolean = itemResults.some(
          (i: QuotationItemResult) => i.alertLevel === 'yellow',
        );
        const alertLevel: 'none' | 'yellow' | 'red' = hasRed
          ? 'red'
          : hasYellow
            ? 'yellow'
            : 'none';

        const alertMsgs: string[] = itemResults
          .filter((i: QuotationItemResult) => i.alertLevel !== 'none')
          .map((i: QuotationItemResult) => i.alertMsg);
        const alertMsg: string =
          alertMsgs.length > 0
            ? [...new Set(alertMsgs)].join('; ')
            : '';

        const totalRev: number = itemResults.reduce(
          (s: number, i: QuotationItemResult) => s + i.totalPrice,
          0,
        );
        const weightedMargin: number =
          totalRev > 0
            ? itemResults.reduce(
                (s: number, i: QuotationItemResult) =>
                  s + i.actualMargin * i.totalPrice,
                0,
              ) / totalRev
            : 0;
        const weightedTarget: number =
          totalRev > 0
            ? itemResults.reduce(
                (s: number, i: QuotationItemResult) =>
                  s + i.targetMargin * i.totalPrice,
                0,
              ) / totalRev
            : 0;

        setResult({
          items: itemResults,
          basePrice: basePriceSum,
          comprehensiveCoefficient: kTotal,
          totalQuantity,
          subtotal,
          feesTotal,
          total: resp.totalAmount,
          alertLevel,
          alertMsg,
          actualMargin: weightedMargin,
          targetMargin: weightedTarget,
          afterSalesRate: resp.afterSalesRate ?? 0,
          marketingExpenseRate: resp.marketingExpenseRate ?? 0,
        });

        if (alertLevel !== 'none' && alertLevel !== lastAlertLevel.current) {
          if (alertLevel === 'red') {
            toast.error(alertMsg);
          } else {
            toast.warning(alertMsg);
          }
          lastAlertLevel.current = alertLevel;
        } else if (alertLevel === 'none' && lastAlertLevel.current !== 'none') {
          lastAlertLevel.current = 'none';
        }
      } catch (error) {
        logger.error('报价计算失败', error);
        setResult(EMPTY_RESULT);
        toast.error('报价计算失败，请检查输入参数');
      } finally {
        setCalculating(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [calculateRequest, setProductRows]);

  return { result, calculating };
}

export { EMPTY_RESULT };
