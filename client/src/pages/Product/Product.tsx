import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Upload, Download, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@client/src/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  getProductList,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@client/src/api/product';
import type { ProductItem } from '@shared/product';
import CanEdit from '@client/src/components/CanEdit';
import {
  ProductFormDialog,
  type ProductFormData,
} from './ProductFormDialog';
import { ProductTable } from './ProductTable';
import { ProductImportDialog } from './ProductImportDialog';

const PAGE_SIZE = 20;

const PRODUCT_IMPORT_HEADERS = [
  '编码（可空）', '产品型号', '系列', 'ERP品类', '品类',
  '新品/老品', '商品颜色', '产品级别', '采购价格', '研发成本', 'MOQ',
];

const PRODUCT_IMPORT_SAMPLE = [
  '', 'AUDIO-01', '音频端', '', '音频-耳机',
  '新品', '黑色', 'A', 15.50, 2.00, 1000,
];

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([PRODUCT_IMPORT_HEADERS, PRODUCT_IMPORT_SAMPLE]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '产品导入');
  XLSX.writeFile(wb, '产品导入模板.xlsx');
}

export default function ProductPage() {
  const [items, setItems] = useState<ProductItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] =
    useState<ProductItem | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<ProductItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [importDialogOpen, setImportDialogOpen] =
    useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getProductList({
        keyword: keyword || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch {
      setError('加载失败，请刷新重试');
      toast.error('获取商品列表失败');
    } finally {
      setLoading(false);
    }
  }, [keyword, page]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleSearch = () => {
    setPage(1);
    fetchList();
  };

  const handleSearchKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Enter') handleSearch();
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  const openEditDialog = (item: ProductItem) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleFormSave = async (data: ProductFormData) => {
    const moq = parseInt(data.moq, 10);
    const payload = {
      code: data.code || undefined,
      model: data.model,
      series: data.series || undefined,
      erpCategory: data.erpCategory || undefined,
      category: data.category,
      color: data.color,
      productGrade: data.productGrade,
      purchasePrice: data.purchasePrice,
      purchaseCost: data.purchasePrice,
      rdCost: data.rdCost,
      moq,
      isNewProduct: data.isNewProduct,
    };

    if (editingItem) {
      await updateProduct(editingItem.id, payload);
      toast.success('更新成功');
    } else {
      await createProduct(payload);
      toast.success('创建成功');
    }
    fetchList();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      toast.success('删除成功');
      setDeleteTarget(null);
      fetchList();
    } catch {
      toast.error('删除失败');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    try {
      const result = await getProductList({ keyword: keyword || undefined, page: 1, pageSize: 10000 });
      const exportRows = result.items.map((item: ProductItem) => ({
        '编码': item.code || '',
        '产品型号': item.model,
        '系列': item.series || '',
        'ERP品类': item.erpCategory || '',
        '品类': item.category || '',
        '新品/老品': item.isNewProduct ? '新品' : '老品',
        '商品颜色': item.color,
        '产品级别': item.productGrade || '',
        '采购价格': item.purchasePrice || '',
        '研发成本': item.rdCost || '',
        'MOQ': item.moq,
      }));
      const headers = [
        '编码', '产品型号', '系列', 'ERP品类', '品类',
        '新品/老品', '商品颜色', '产品级别', '采购价格', '研发成本', 'MOQ',
      ];
      const ws = XLSX.utils.json_to_sheet(exportRows, { header: headers });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '产品数据');
      XLSX.writeFile(wb, '物料数据导出.xlsx');
      toast.success(`成功导出 ${exportRows.length} 条数据`);
    } catch {
      toast.error('导出失败');
    }
  };

  const totalPages = Math.max(
    1,
    Math.ceil(total / PAGE_SIZE),
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-foreground">
            商品管理
          </h1>
          <div className="relative w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="搜索型号或颜色..."
              value={keyword}
              onChange={(
                e: React.ChangeEvent<HTMLInputElement>,
              ) => setKeyword(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
            className="gap-1.5"
          >
            <Download className="size-4" />
            下载模板
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-1.5"
          >
            <FileDown className="size-4" />
            导出
          </Button>
          <CanEdit>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportDialogOpen(true)}
              className="gap-1.5"
            >
              <Upload className="size-4" />
              批量导入
            </Button>
          </CanEdit>
          <CanEdit>
            <Button
              onClick={openCreateDialog}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              新建商品
            </Button>
          </CanEdit>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            加载中...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-40 text-destructive text-sm">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
            暂无数据
          </div>
        ) : (
          <ProductTable
            items={items}
            onEdit={openEditDialog}
            onDelete={setDeleteTarget}
          />
        )}
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between border-t border-border px-6 py-3">
          <span className="text-xs text-muted-foreground">
            共 {total} 条记录，第 {page}/{totalPages} 页
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              下一页
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingItem={editingItem}
        onSave={handleFormSave}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open: boolean) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除商品「{deleteTarget?.model} -{' '}
              {deleteTarget?.color}
              」吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <ProductImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportSuccess={fetchList}
      />
    </div>
  );
}
