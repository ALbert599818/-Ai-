import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, User, X, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface MockCustomer {
  id: string;
  name: string;
  region: string;
  mode: string;
  creditTerm: string;
}

export interface SelectedProduct {
  id: string;
  model: string;
  color: string;
  purchasePrice: string;
}

interface QuotationEngineSearchBarProps {
  customers: MockCustomer[];
  selectedCustomer: MockCustomer | null;
  onSelectCustomer: (customer: MockCustomer) => void;
  products: SelectedProduct[];
  selectedProduct: SelectedProduct | null;
  onSelectProduct: (product: SelectedProduct) => void;
  onSearchProducts: (keyword: string) => void;
}

const QuotationEngineSearchBar = ({
  customers,
  selectedCustomer,
  onSelectCustomer,
  products,
  selectedProduct,
  onSelectProduct,
  onSearchProducts,
}: QuotationEngineSearchBarProps) => {
  const [customerQuery, setCustomerQuery] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);
  const productRef = useRef<HTMLDivElement>(null);

  const filteredCustomers = customers.filter((c: MockCustomer) =>
    c.name.toLowerCase().includes(customerQuery.toLowerCase()),
  );

  const handleCustomerFocus = () => {
    setCustomerQuery('');
    setShowCustomerDropdown(true);
  };

  const handleCustomerSelect = (customer: MockCustomer) => {
    onSelectCustomer(customer);
    setCustomerQuery('');
    setShowCustomerDropdown(false);
  };

  const handleClearCustomer = () => {
    onSelectCustomer(null as unknown as MockCustomer);
    setCustomerQuery('');
  };

  const handleProductSearch = useCallback((keyword: string) => {
    onSearchProducts(keyword);
    setShowProductDropdown(true);
  }, [onSearchProducts]);

  const handleProductFocus = () => {
    setProductQuery('');
    onSearchProducts('');
    setShowProductDropdown(true);
  };

  const handleProductChange = useCallback((value: string) => {
    setProductQuery(value);
    onSearchProducts(value);
    setShowProductDropdown(true);
  }, [onSearchProducts]);

  const handleProductSelect = (p: SelectedProduct) => {
    onSelectProduct(p);
    setProductQuery('');
    setShowProductDropdown(false);
  };

  const handleClearProduct = () => {
    onSelectProduct(null as unknown as SelectedProduct);
    setProductQuery('');
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
      if (productRef.current && !productRef.current.contains(e.target as Node)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-4 rounded-3xl border border-[#dde9f5] bg-[#f4faff] px-5 py-3">
      {/* Customer search */}
      <div ref={customerRef} className="relative min-w-[260px] flex-1">
        <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-[#1f4866]">
          <User className="size-3.5 text-[#2a7de1]" />
          客户
        </div>
        {selectedCustomer ? (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#2a7de1] px-3 py-1 text-xs font-medium text-white">
              {selectedCustomer.name}
            </span>
            <button
              type="button"
              onClick={handleClearCustomer}
              className="rounded-full p-0.5 text-[#5a7f98] hover:bg-[#dde9f3] hover:text-[#c0392b]"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              value={customerQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerQuery(e.target.value)}
              onFocus={handleCustomerFocus}
              placeholder="客户名/编码..."
              className="h-8 rounded-full border-[#cddae6] bg-white text-sm focus:border-[#2a7de1] focus:ring-1 focus:ring-[#2a7de1]"
            />
          </div>
        )}
        {showCustomerDropdown && !selectedCustomer && (
          <div className="absolute left-0 top-full z-10 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-[#dde9f3] bg-white shadow-lg">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((c: MockCustomer) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleCustomerSelect(c)}
                  className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-[#f4faff]"
                >
                  <span className="text-[#0b2b3b]">{c.name}</span>
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-xs text-[#5a7f98]">
                未找到 &ldquo;{customerQuery}&rdquo;
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product search */}
      <div ref={productRef} className="relative min-w-[280px] flex-1">
        <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-[#1f4866]">
          <Search className="size-3.5 text-[#2a7de1]" />
          商品
        </div>
        {selectedProduct ? (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#2a7de1] px-3 py-1 text-xs font-medium text-white">
              {selectedProduct.model} ({selectedProduct.color})
            </span>
            <span className="rounded-full bg-[#e9f0f7] px-2 py-0.5 text-[10px] font-semibold text-[#1f4866]">
              基价 ¥{Number(selectedProduct.purchasePrice).toFixed(2)}
            </span>
            <button
              type="button"
              onClick={handleClearProduct}
              className="rounded-full p-0.5 text-[#5a7f98] hover:bg-[#dde9f3] hover:text-[#c0392b]"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              value={productQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleProductChange(e.target.value)}
              onFocus={handleProductFocus}
              placeholder="商品名/编码..."
              className="h-8 flex-1 rounded-full border-[#cddae6] bg-white text-sm focus:border-[#2a7de1] focus:ring-1 focus:ring-[#2a7de1]"
            />
          </div>
        )}
        {showProductDropdown && !selectedProduct && (
          <div className="absolute left-0 top-full z-10 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-[#dde9f3] bg-white shadow-lg">
            {products.length > 0 ? (
              products.map((p: SelectedProduct) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleProductSelect(p)}
                  className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-[#f4faff]"
                >
                  <span className="flex items-center gap-1 text-[#0b2b3b]">
                    <Package className="size-3 text-[#2a7de1]" />
                    {p.model} ({p.color})
                  </span>
                  <span className="font-mono text-xs text-[#1f4866]">
                    ¥{Number(p.purchasePrice).toFixed(2)}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-xs text-[#5a7f98]">
                未找到 &ldquo;{productQuery}&rdquo;
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationEngineSearchBar;
