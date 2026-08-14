import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import CanEdit from '@client/src/components/CanEdit';
import type { ProductItem } from '@shared/product';

const TH_BASE =
  'border border-border bg-accent/50 px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap';
const TD_BASE =
  'px-4 py-2.5 text-foreground whitespace-nowrap';

interface ProductTableProps {
  items: ProductItem[];
  onEdit: (item: ProductItem) => void;
  onDelete: (item: ProductItem) => void;
}

function GradeBadge({ grade }: { grade: string }) {
  if (grade === 'S') {
    return (
      <Badge className="bg-red-500 text-white border-transparent text-[11px]">
        S
      </Badge>
    );
  }
  if (grade === 'A') {
    return (
      <Badge className="bg-orange-500 text-white border-transparent text-[11px]">
        A
      </Badge>
    );
  }
  if (grade === 'B') {
    return (
      <Badge className="bg-blue-500 text-white border-transparent text-[11px]">
        B
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-[11px]">
      {grade || '无'}
    </Badge>
  );
}

function NewProductBadge({ isNew }: { isNew: boolean }) {
  if (isNew) {
    return (
      <Badge className="bg-emerald-500 text-white border-transparent text-[11px]">
        新品
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-[11px]">
      老品
    </Badge>
  );
}

export function ProductTable({
  items,
  onEdit,
  onDelete,
}: ProductTableProps) {
  return (
    <table className="w-full border-collapse text-sm min-w-[1200px]">
      <thead>
        <tr className="border border-border">
          <th className={TH_BASE} style={{ minWidth: 80 }}>
            编码
          </th>
          <th className={TH_BASE} style={{ minWidth: 120 }}>
            产品型号
          </th>
          <th className={TH_BASE} style={{ minWidth: 80 }}>
            系列
          </th>
          <th className={TH_BASE} style={{ minWidth: 100 }}>
            ERP品类
          </th>
          <th className={TH_BASE} style={{ minWidth: 90 }}>
            品类
          </th>
          <th className={TH_BASE} style={{ minWidth: 70 }}>
            新品/老品
          </th>
          <th className={TH_BASE} style={{ minWidth: 80 }}>
            商品颜色
          </th>
          <th className={TH_BASE} style={{ minWidth: 70 }}>
            产品级别
          </th>
          <th
            className={`${TH_BASE} text-right`}
            style={{ minWidth: 110 }}
          >
            采购价格(元)
          </th>
          <th
            className={`${TH_BASE} text-right`}
            style={{ minWidth: 90 }}
          >
            研发成本
          </th>
          <th
            className={`${TH_BASE} text-right`}
            style={{ minWidth: 80 }}
          >
            MOQ
          </th>
          <th
            className={`${TH_BASE} text-center`}
            style={{ minWidth: 100 }}
          >
            操作
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((item: ProductItem) => (
          <tr
            key={item.id}
            className="border-x border-b border-border hover:bg-accent/30 transition-colors"
          >
            {/* 编码 */}
            <td className={`${TD_BASE} font-mono text-muted-foreground`}>
              {item.code || '-'}
            </td>
            {/* 产品型号 */}
            <td className={`${TD_BASE} font-mono`}>
              {item.model}
            </td>
            {/* 系列 */}
            <td className={`${TD_BASE} text-muted-foreground`}>
              {item.series || '-'}
            </td>
            {/* ERP品类 */}
            <td className={`${TD_BASE} text-muted-foreground`}>
              {item.erpCategory || '-'}
            </td>
            {/* 品类 */}
            <td className={TD_BASE}>
              {item.category || '-'}
            </td>
            {/* 新品/老品 */}
            <td className={TD_BASE}>
              <NewProductBadge isNew={item.isNewProduct} />
            </td>
            {/* 商品颜色 */}
            <td className={TD_BASE}>{item.color}</td>
            {/* 产品级别 */}
            <td className={TD_BASE}>
              <GradeBadge grade={item.productGrade} />
            </td>
            {/* 采购价格 */}
            <td
              className={`${TD_BASE} text-right font-mono tabular-nums`}
            >
              {Number(item.purchasePrice).toFixed(2)}
            </td>
            {/* 研发成本 */}
            <td
              className={`${TD_BASE} text-right font-mono tabular-nums`}
            >
              {Number(item.rdCost || 0).toFixed(2)}
            </td>
            {/* MOQ */}
            <td
              className={`${TD_BASE} text-right font-mono tabular-nums`}
            >
              {item.moq}
            </td>
            {/* 操作 */}
            <td className="px-4 py-2.5">
              <div className="flex items-center justify-center gap-1">
                <CanEdit>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(item)}
                    className="h-7 px-2 text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                </CanEdit>
                <CanEdit>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(item)}
                    className="h-7 px-2 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </CanEdit>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
