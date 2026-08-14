import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Badge } from '@client/src/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
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
  listUsers,
  deleteUser,
  adminUpdateUser,
} from '@client/src/api/user-account';
import type { UserAccountDetail } from '@client/src/api/user-account';
import { useAppAuth } from '@client/src/contexts/AuthContext';
import { ROLE_LABEL, ALL_ROLES } from '@shared/role';
import EditUserDialog from './EditUserDialog';
import CreateTestDialog from './CreateTestDialog';
import ResetPasswordDialog from './ResetPasswordDialog';

const PAGE_SIZE = 15;

const REGION_OPTIONS = ['欧美', '澳新日韩', '拉美', '东南亚', '其他地区'] as const;

export default function UserManagement() {
  const { user: currentUser } = useAppAuth();
  const [items, setItems] = useState<UserAccountDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccountDetail | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetUser, setResetUser] = useState<UserAccountDetail | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<UserAccountDetail | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listUsers({
        page,
        pageSize: PAGE_SIZE,
        keyword: keyword || undefined,
        region: regionFilter || undefined,
      });
      const filtered = roleFilter
        ? result.items.filter((u) => u.roles.includes(roleFilter))
        : result.items;
      setItems(filtered);
      setTotal(result.total);
    } catch {
      toast.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, keyword, regionFilter, roleFilter]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleSearch = () => {
    setPage(1);
    fetchList();
  };

  const openEditDialog = (user: UserAccountDetail) => {
    setEditingUser(user);
    setEditOpen(true);
  };

  const openResetDialog = (user: UserAccountDetail) => {
    setResetUser(user);
    setResetOpen(true);
  };

  const handleToggleActive = async (
    user: UserAccountDetail,
    isActive: boolean,
  ) => {
    try {
      await adminUpdateUser(user.userId, { isActive });
      toast.success(isActive ? '已启用' : '已禁用');
      fetchList();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '操作失败';
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget.userId);
      toast.success('删除成功');
      setDeleteTarget(null);
      fetchList();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '删除失败';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">用户管理</h1>
          <p className="text-sm text-muted-foreground">
            管理系统用户账号、角色权限与账号状态
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 size-4" />
          新建测试账号
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3">
        <div className="flex min-w-[280px] flex-1 items-center gap-2">
          <Input
            placeholder="搜索用户名或显示名"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="max-w-xs"
          />
          <Button variant="secondary" size="sm" onClick={handleSearch}>
            <Search className="mr-1 size-3.5" />
            搜索
          </Button>
        </div>

        <Select
          value={regionFilter || '__empty__'}
          onValueChange={(v) => {
            setRegionFilter(v === '__empty__' ? '' : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="全部区域" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__empty__">全部区域</SelectItem>
            {REGION_OPTIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={roleFilter || '__empty__'}
          onValueChange={(v) => {
            setRoleFilter(v === '__empty__' ? '' : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="全部角色" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__empty__">全部角色</SelectItem>
            {ALL_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABEL[r] || r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">用户名</th>
              <th className="px-4 py-3 text-left font-medium">显示名</th>
              <th className="px-4 py-3 text-left font-medium">区域</th>
              <th className="px-4 py-3 text-left font-medium">角色</th>
              <th className="px-4 py-3 text-left font-medium">状态</th>
              <th className="px-4 py-3 text-left font-medium">创建时间</th>
              <th className="px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  加载中...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  暂无用户数据
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border/60 last:border-b-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium">{item.username}</td>
                  <td className="px-4 py-3">{item.displayName || '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.region || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {item.roles.length === 0 ? (
                        <span className="text-muted-foreground">未分配</span>
                      ) : (
                        item.roles.map((r) => (
                          <Badge
                            key={r}
                            variant={
                              r === 'super_admin' ? 'default' : 'secondary'
                            }
                          >
                            {ROLE_LABEL[r] || r}
                          </Badge>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={item.isActive ? 'default' : 'outline'}
                      className={
                        item.isActive
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/15'
                          : ''
                      }
                    >
                      {item.isActive ? '启用' : '禁用'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString('zh-CN')
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => openEditDialog(item)}
                        title="编辑"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() =>
                          handleToggleActive(item, !item.isActive)
                        }
                        title={item.isActive ? '禁用' : '启用'}
                      >
                        <ShieldCheck className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => openResetDialog(item)}
                        title="重置密码"
                      >
                        <KeyRound className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(item)}
                        disabled={currentUser?.userId === item.userId}
                        title="删除"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
          <span>
            共 {total} 条 · 第 {page}/{totalPages} 页
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
      </div>

      <EditUserDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        user={editingUser}
        onSuccess={fetchList}
      />

      <CreateTestDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchList}
      />

      <ResetPasswordDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        user={resetUser}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除该用户？</AlertDialogTitle>
            <AlertDialogDescription>
              将永久删除用户{' '}
              <span className="font-medium text-foreground">
                {deleteTarget?.username}
              </span>{' '}
              （{deleteTarget?.displayName}）的所有数据，此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
