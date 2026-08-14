import type { MockCustomer } from './QuotationEngineSearchBar';

interface QuotationEngineCustomerInfoProps {
  customer: MockCustomer;
}

const INFO_ITEMS: Array<{ label: string; key: keyof MockCustomer }> = [
  { label: '地区:', key: 'region' },
  { label: '模式:', key: 'mode' },
  { label: '信用条件:', key: 'creditTerm' },
];

const QuotationEngineCustomerInfo = ({ customer }: QuotationEngineCustomerInfoProps) => {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-[14px] bg-[#e8f0f7] px-5 py-2.5 text-xs text-[#1b4b66]">
      {INFO_ITEMS.map((item) => (
        <span key={item.key} className="inline-flex items-center gap-1">
          {item.label}
          <strong className="text-[#0b2b3b]">{customer[item.key]}</strong>
        </span>
      ))}
    </div>
  );
};

export default QuotationEngineCustomerInfo;
