import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@client/src/components/ui/badge';
import {
  Card,
  CardContent,
} from '@client/src/components/ui/card';
import { toast } from 'sonner';
import {
  getMyPendingQuotations,
} from '@client/src/api/my-center';
import type { MyQuotationItem } from '@client/src/api/my-center';

function getStatusBadge(status: string): { className: string; label: string } {
  switch (status) {
    case 'draft':
      return {
        className: 'bg-gray-100 text-gray-600',
        label: '草稿',
      };
    case 'submitted':
      return {
        className: 'bg-blue-100 text-blue-700',
        label: '待审批',
      };
    default:
      return {
        className: 'bg-gray-100 text-gray-600',
        label: status,
      };
  }
}

function formatAmount(value: number): string {
  return `¥${value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function PendingTab() {
  const [items, setItems] = useState<MyQuotationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await getMyPendingQuotations();
        setItems(data.items);
      } catch {
        toast.error('获取待办报价单失败');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        加载中...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        暂无数据
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((item: MyQuotationItem) => {
        const badge = getStatusBadge(item.status);
        return (
          <Link key={item.id} to={`/quotations/${item.id}`}>
            <Card className="cursor-pointer transition-colors hover:bg-accent/50">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">
                    {item.quotationNo}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.customerShortName}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {formatAmount(item.totalAmount)}
                  </span>
                  <Badge variant="secondary" className={badge.className}>
                    {badge.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
