import { useState, useEffect, useCallback, useMemo } from 'react';
import { Zap, RefreshCw, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/lark-shim/logger';
import { toast } from 'sonner';
import { useAppAuth } from '@client/src/contexts/AuthContext';

import { priceSensitivityApi } from '@client/src/api';
import { creditTermApi } from '@client/src/api';
import { purchaseQuantityApi } from '@client/src/api';
import { logisticsCostApi } from '@client/src/api';
import { otherDiscountApi } from '@client/src/api';
import { productApi } from '@client/src/api';
import { customerApi } from '@client/src/api';
import { customFeeConfigApi } from '@client/src/api';
import { productCategoryApi } from '@client/src/api';
import type { ProductCategoryItem } from '@shared/product-category';
import type { QuotationCalculateRequest } from '@shared/quotation';
import type { PriceSensitivityItem } from '@shared/price-sensitivity';
import type { CreditTermItem } from '@shared/credit-term';
import type { PurchaseQuantityItem } from '@shared/purchase-quantity';
import type { LogisticsCostItem } from '@shared/logistics-cost';
import type { OtherDiscountItem } from '@shared/other-discount';
import type { ProductItem } from '@shared/product';
import type { CustomFeeConfigItem } from '@shared/custom-fee-config';
import type { MockCustomer } from './QuotationEngineSearchBar';
import type { ProductRow, InlineFeeItem } from './StepProduct';
import { EMPTY_PRODUCT_ROW } from './StepProduct';
import type { CustomerType, NewCustomerInfo } from './StepCustomer';
import { useQuotationCalculation } from './useQuotationCalculation';
import StepCustomer from './StepCustomer';
import StepProduct from './StepProduct';
import QuotationEngineSummary from './QuotationEngineSummary';
import QuotationEngineBottomBar from './QuotationEngineBottomBar';

const DEFAULT_NEW_CUSTOMER: NewCustomerInfo = {
  name: '',
  country: '中国',
  region: '',
  channelType: '',
  creditTerm: '',
};

const QuotationEngine = () => {
  const { hasRole } = useAppAuth();
  const isSuperAdmin: boolean = hasRole('super_admin');

  const [priceSensitivities, setPriceSensitivities] = useState<PriceSensitivityItem[]>([]);
  const [creditTerms, setCreditTerms] = useState<CreditTermItem[]>([]);
  const [purchaseQuantities, setPurchaseQuantities] = useState<PurchaseQuantityItem[]>([]);
  const [logisticsCosts, setLogisticsCosts] = useState<LogisticsCostItem[]>([]);
  const [otherDiscounts, setOtherDiscounts] = useState<OtherDiscountItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [customers, setCustomers] = useState<MockCustomer[]>([]);
  const [, setFeeProjects] = useState<string[]>([]);
  const [categoryList, setCategoryList] = useState<ProductCategoryItem[]>([]);

  const [selectedCustomer, setSelectedCustomer] = useState<MockCustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [failedItems, setFailedItems] = useState<string[]>([]);

  // Multi-product rows
  const [productRows, setProductRows] = useState<ProductRow[]>([]);

  // Step flow state
  const [customerType, setCustomerType] = useState<CustomerType>('existing');
  const [newCustomerInfo, setNewCustomerInfo] =
    useState<NewCustomerInfo>(DEFAULT_NEW_CUSTOMER);
  const [categoryGrades, setCategoryGrades] = useState<Record<string, string>>({});

  const extractErrorReason = (reason: unknown): string => {
    if (!reason) return '未知错误';
    if (reason instanceof Error) {
      const msg = reason.message || '';
      if (msg.includes('超时')) return '请求超时';
      if (msg.includes('Network Error')) return '网络异常';
      if (msg.includes('无操作权限')) return '权限不足';
      if (msg) return msg.length > 40 ? `${msg.slice(0, 40)}...` : msg;
      return '未知错误';
    }
    if (typeof reason === 'object' && reason !== null) {
      const r = reason as {
        status?: number;
        statusCode?: number;
        message?: string;
        response?: { status?: number };
      };
      const status = r.status ?? r.response?.status ?? r.statusCode;
      if (status === 401) return '登录已失效';
      if (status === 403) return '权限不足';
      if (status === 404) return '接口不存在';
      if (status === 500) return '服务端错误';
      if (typeof status === 'number') return `HTTP ${status}`;
      if (typeof r.message === 'string') {
        return r.message.length > 40 ? `${r.message.slice(0, 40)}...` : r.message;
      }
    }
    return '未知错误';
  };

  const runLoad = useCallback(async (): Promise<{
    failed: string[];
    reasons: string[];
    total: number;
    allTimeout: boolean;
  }> => {
    // 首个请求使用 90s 长超时，专门应付生产环境冷启动；后续请求复用已暖的后端，30s 足够
    const COLD_START_TIMEOUT_MS = 90000;
    const NORMAL_TIMEOUT_MS = 30000;

    const withTimeout = <T,>(
      p: Promise<T>,
      label: string,
      timeoutMs: number,
    ): Promise<T> =>
      new Promise<T>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error(`${label}请求超时（${Math.round(timeoutMs / 1000)}s）`)),
          timeoutMs,
        );
        p.then(
          (val) => {
            clearTimeout(timer);
            resolve(val);
          },
          (err) => {
            clearTimeout(timer);
            reject(err);
          },
        );
      });

    type ApiCall = {
      name: string;
      call: () => Promise<unknown>;
      onFulfilled: (value: unknown) => void;
    };

    const apis: ApiCall[] = [
      {
        name: '价格敏感系数',
        call: () => priceSensitivityApi.getPriceSensitivityList({ pageSize: 100 }),
        onFulfilled: (v) => setPriceSensitivities((v as { items: PriceSensitivityItem[] }).items),
      },
      {
        name: '信用条件',
        call: () => creditTermApi.getCreditTermList({ pageSize: 100 }),
        onFulfilled: (v) => setCreditTerms((v as { items: CreditTermItem[] }).items),
      },
      {
        name: '拿货量与物流',
        call: () => purchaseQuantityApi.getPurchaseQuantityList({ pageSize: 100 }),
        onFulfilled: (v) => setPurchaseQuantities((v as { items: PurchaseQuantityItem[] }).items),
      },
      {
        name: '物流成本',
        call: () => logisticsCostApi.getLogisticsCostList({ pageSize: 100 }),
        onFulfilled: (v) => setLogisticsCosts((v as { items: LogisticsCostItem[] }).items),
      },
      {
        name: '其它折扣',
        call: () => otherDiscountApi.getOtherDiscountList({ pageSize: 100 }),
        onFulfilled: (v) => setOtherDiscounts((v as { items: OtherDiscountItem[] }).items),
      },
      {
        name: '商品',
        call: () => productApi.getProductList({ pageSize: 50 }),
        onFulfilled: (v) => setProducts((v as { items: ProductItem[] }).items),
      },
      {
        name: '客户',
        call: () => customerApi.getCustomerList({ pageSize: 200 }),
        onFulfilled: (v) => {
          const mappedCustomers: MockCustomer[] = (
            v as { items: Array<{ id: string; shortName: string; region: string; channelType: string; creditCondition: string }> }
          ).items.map((c) => ({
            id: c.id,
            name: c.shortName,
            region: c.region,
            mode: c.channelType,
            creditTerm: c.creditCondition,
          }));
          setCustomers(mappedCustomers);
        },
      },
      {
        name: '定制项配置',
        call: () => customFeeConfigApi.getCustomFeeConfigList({ pageSize: 100 }),
        onFulfilled: (v) =>
          setFeeProjects(
            ((v as { items: CustomFeeConfigItem[] }).items).map(
              (item: CustomFeeConfigItem) => item.name,
            ),
          ),
      },
      {
        name: '品类列表',
        call: () => productCategoryApi.getProductCategories(),
        onFulfilled: (v) => {
          const sorted = [...(v as ProductCategoryItem[])].sort(
            (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
          );
          setCategoryList(sorted);
        },
      },
    ];

    const failed: string[] = [];
    const reasons: string[] = [];

    // 全部串行：第一个请求用长超时触发后端冷启动，后续请求复用已暖的后端
    for (let i = 0; i < apis.length; i++) {
      const api = apis[i];
      const timeoutMs = i === 0 ? COLD_START_TIMEOUT_MS : NORMAL_TIMEOUT_MS;
      try {
        const value = await withTimeout(api.call(), api.name, timeoutMs);
        try { api.onFulfilled(value); } catch (e) { logger.error('应用数据失败', e); }
      } catch (err) {
        const reason = extractErrorReason(err);
        failed.push(api.name);
        reasons.push(`${api.name}(${reason})`);
      }
    }

    const allTimeout =
      failed.length > 0 && reasons.every((r: string) => r.includes('超时'));

    return { failed, reasons, total: apis.length, allTimeout };
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setFailedItems([]);

    let result = await runLoad();

    // 兜底：若全部失败且均为超时，说明后端冷启动过久，自动重试一次
    if (result.allTimeout && result.failed.length === result.total) {
      toast('首次加载超时，正在重试...', { duration: 3000 });
      result = await runLoad();
    }

    if (result.failed.length > 0) {
      const detail = result.reasons.join('、');
      logger.error('部分配置数据加载失败', new Error(detail));
      toast.error(
        `部分数据加载失败（${result.failed.length}/${result.total}）：${detail}。请点击右上角刷新重试`,
        { duration: 8000 },
      );
      setFailedItems(result.failed);
    }

    setLoading(false);
  }, [runLoad]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleSearchProducts = useCallback(async (keyword: string) => {
    try {
      const result = await productApi.getProductList({ keyword, pageSize: 10 });
      setProducts(result.items);
    } catch (error) {
      logger.error('搜索商品失败', error);
    }
  }, []);

  const handleCustomerTypeChange = useCallback((type: CustomerType) => {
    setCustomerType(type);
  }, []);

  // ── Multi-product row management ──

  const handleAddRow = useCallback(() => {
    setProductRows((prev: ProductRow[]) => [...prev, EMPTY_PRODUCT_ROW()]);
  }, []);

  const handleRemoveRow = useCallback((id: string) => {
    setProductRows((prev: ProductRow[]) =>
      prev.filter((r: ProductRow) => r.id !== id),
    );
  }, []);

  const handleUpdateRow = useCallback(
    (id: string, data: Partial<ProductRow>) => {
      setProductRows((prev: ProductRow[]) =>
        prev.map((r: ProductRow) => (r.id === id ? { ...r, ...data } : r)),
      );
    },
    [],
  );

  const handleClearAll = useCallback(() => {
    setProductRows([]);
  }, []);

  const handleImportProducts = useCallback((rows: ProductRow[]) => {
    setProductRows((prev: ProductRow[]) => [...prev, ...rows]);
  }, []);

  const handleReset = useCallback(() => {
    setCustomerType('existing');
    setNewCustomerInfo(DEFAULT_NEW_CUSTOMER);
    if (customers.length > 0) setSelectedCustomer(customers[0]);
    setProductRows([]);
    setCategoryGrades({});
  }, [customers]);

  // Logistics options for per-product inline panels
  const logisticsOptions: string[] = useMemo(
    () => logisticsCosts.map((lc: LogisticsCostItem) => lc.costType),
    [logisticsCosts],
  );

  // Build API request from current form state
  const calculateRequest: QuotationCalculateRequest | null = useMemo(() => {
    const validRows = productRows.filter(
      (r: ProductRow) => r.model && r.color && r.quantity > 0,
    );
    if (validRows.length === 0) return null;

    const isNewCustomer: boolean = customerType === 'new';
    const customerShortName: string = isNewCustomer
      ? newCustomerInfo.name
      : selectedCustomer?.name ?? '';

    const grade: string = '无';
    const creditCondition: string = isNewCustomer
      ? newCustomerInfo.creditTerm
      : selectedCustomer?.creditTerm ?? '';
    const channelType: string = isNewCustomer
      ? newCustomerInfo.channelType || 'B2B'
      : selectedCustomer?.mode ?? 'B2B';
    const region: string = isNewCustomer
      ? newCustomerInfo.region || '其他'
      : selectedCustomer?.region ?? '其他';
    const country: string = isNewCustomer
      ? newCustomerInfo.country || ''
      : '';

    return {
      customerShortName,
      isNewCustomer,
      country,
      grade,
      creditCondition,
      channelType,
      region,
      logisticsType: validRows[0]?.logisticsType || '散货',
      customFees: [],
      categoryGrades,
      items: validRows.map((r: ProductRow) => ({
        model: r.model,
        color: r.color,
        quantity: r.quantity,
        logisticsType: r.logisticsType,
        flexibleReserve: r.flexibleIsRate
          ? r.flexibleReserve / 100
          : r.flexibleReserve,
        flexibleIsRate: r.flexibleIsRate,
        customFees: r.customFees.map((f: InlineFeeItem) => ({
          feeName: f.project,
          feeAmount: f.amount,
        })),
      })),
    };
  }, [
    productRows,
    customerType,
    selectedCustomer,
    newCustomerInfo,
    categoryGrades,
  ]);

  // Calculation via custom hook (300ms debounce, multi-item support)
  const { result: quotationResult, calculating } =
    useQuotationCalculation(calculateRequest, setProductRows);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-sm text-muted-foreground">加载配置数据中...</div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-20">
      <div className="mx-auto max-w-[1400px] rounded-sm border border-border bg-card p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
            <Zap className="size-5 text-primary" />
            品牌报价引擎
          </h1>
          <button
            type="button"
            onClick={() => loadAllData()}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            title="重新加载配置数据"
          >
            <RefreshCw className="size-3.5" />
            重新加载
          </button>
        </div>

        {failedItems.length > 0 && (
          <div className="mb-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <div className="flex-1">
              <div className="font-medium">
                配置数据加载不完整（{failedItems.length}/8）
              </div>
              <div className="mt-1 text-xs text-destructive/80">
                失败项：{failedItems.join('、')}。可能原因：登录态失效 / 网络超时 / 接口异常。
              </div>
            </div>
            <button
              type="button"
              onClick={() => loadAllData()}
              className="shrink-0 rounded-md border border-destructive/30 px-2.5 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              重试
            </button>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <StepCustomer
            customers={customers}
            selectedCustomer={selectedCustomer}
            onSelectCustomer={setSelectedCustomer}
            customerType={customerType}
            onCustomerTypeChange={handleCustomerTypeChange}
            newCustomerInfo={newCustomerInfo}
            onNewCustomerChange={setNewCustomerInfo}
            isSuperAdmin={isSuperAdmin}
            categoryGrades={categoryGrades}
            onCategoryGradesChange={setCategoryGrades}
            categoryList={categoryList}
            creditTermOptions={creditTerms.map((ct: CreditTermItem) => ct.subItem)}
          />

          <StepProduct
            allProducts={products}
            productRows={productRows}
            logisticsOptions={logisticsOptions}
            onAddRow={handleAddRow}
            onRemoveRow={handleRemoveRow}
            onUpdateRow={handleUpdateRow}
            onClearAll={handleClearAll}
            onImportProducts={handleImportProducts}
          />

          <div className="mt-2">
            <QuotationEngineSummary
              result={quotationResult}
              onReset={handleReset}
              calculating={calculating}
            />
          </div>
        </div>

        <QuotationEngineBottomBar
          result={quotationResult}
          saveRequest={calculateRequest}
        />
      </div>
    </div>
  );
};

export default QuotationEngine;
