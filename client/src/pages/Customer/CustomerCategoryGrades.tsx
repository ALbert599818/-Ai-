import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getCustomerCategoryGrades,
} from '@client/src/api/customer';
import {
  PRODUCT_CATEGORIES,
} from '@shared/customer';
import type { CustomerCategoryGradeItem } from '@shared/customer';

interface CustomerCategoryGradesProps {
  customerId: string;
  defaultGrade: string;
}

type GradeMap = Record<string, string>;

function getGradeBadgeStyle(grade: string): { bg: string; text: string } | null {
  if (grade === 'S') return { bg: 'hsl(40, 85%, 55%)', text: '#fff' };
  if (grade === 'A') return { bg: 'hsl(210, 70%, 55%)', text: '#fff' };
  if (grade === 'B') return { bg: 'hsl(220, 10%, 60%)', text: '#fff' };
  return null;
}

export default function CustomerCategoryGrades({
  customerId,
  defaultGrade,
}: CustomerCategoryGradesProps) {
  const [grades, setGrades] = useState<GradeMap>({});
  const [loading, setLoading] = useState(true);

  const loadGrades = useCallback(async () => {
    setLoading(true);
    try {
      const items: CustomerCategoryGradeItem[] =
        await getCustomerCategoryGrades(customerId);
      if (items.length === 0) {
        // Auto-fill from main grade for historical customers
        const fallback = defaultGrade || '无';
        const initial: GradeMap = {};
        for (const cat of PRODUCT_CATEGORIES) {
          initial[cat] = fallback;
        }
        setGrades(initial);
      } else {
        const map: GradeMap = {};
        for (const item of items) {
          map[item.category] = item.grade;
        }
        // Ensure all 9 categories exist
        for (const cat of PRODUCT_CATEGORIES) {
          if (!map[cat]) map[cat] = '无';
        }
        setGrades(map);
      }
    } catch {
      toast.error('加载品类等级失败');
    } finally {
      setLoading(false);
    }
  }, [customerId, defaultGrade]);

  useEffect(() => {
    loadGrades();
  }, [loadGrades]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
        <Loader2 className="size-4 animate-spin mr-2" />
        加载品类等级...
      </div>
    );
  }

  return (
    <div className="border border-border rounded-sm bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-medium text-foreground">
          品类等级配置
        </h3>
      </div>
      <div className="grid grid-cols-3 gap-2 p-4">
        {PRODUCT_CATEGORIES.map((cat: string) => {
          const grade = grades[cat] || '无';
          const style = getGradeBadgeStyle(grade);
          return (
            <div
              key={cat}
              className="flex items-center justify-between px-3 py-2 border border-border rounded-sm bg-background"
            >
              <span className="text-sm text-foreground">{cat}</span>
              {style ? (
                <span
                  className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-sm"
                  style={{ backgroundColor: style.bg, color: style.text }}
                >
                  {grade}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">{grade}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
