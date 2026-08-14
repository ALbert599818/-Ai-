import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Label } from '@client/src/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { toast } from 'sonner';
import { adminUpdateUser } from '@client/src/api/user-account';
import type { UserAccountInfo } from '@client/src/api/user-account';
import { ROLE_LABEL, ALL_ROLES } from '@shared/role';

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserAccountInfo | null;
  onSuccess: () => void;
}

interface FormState {
  displayName: string;
  email: string;
  phone: string;
  region: string;
  role: string;
}

const REGION_OPTIONS = ['欧美', '澳新日韩', '拉美', '东南亚', '其他地区'] as const;

export default function EditUserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: EditUserDialogProps) {
  const [form, setForm] = useState<FormState>({
    displayName: '',
    email: '',
    phone: '',
    region: '',
    role: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && user) {
      setForm({
        displayName: user.displayName || '',
        email: user.email || '',
        phone: user.phone || '',
        region: user.region || '',
        role: user.roles[0] || '',
      });
    }
  }, [open, user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await adminUpdateUser(user.userId, {
        displayName: form.displayName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        region: form.region,
        roles: form.role ? [form.role] : [],
      });
      toast.success('更新成功');
      onOpenChange(false);
      onSuccess();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '更新失败';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>编辑用户</DialogTitle>
          <DialogDescription>
            修改账号 {user.username} 的基本信息和角色权限
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>显示名</Label>
            <Input
              value={form.displayName}
              onChange={(e) =>
                setForm({ ...form, displayName: e.target.value })
              }
              placeholder="请输入显示名"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>邮箱</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>手机号</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="13800000000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>区域</Label>
              <Select
                value={form.region || '__empty__'}
                onValueChange={(v) =>
                  setForm({ ...form, region: v === '__empty__' ? '' : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择区域" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__empty__">无区域</SelectItem>
                  {REGION_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>角色</Label>
              <Select
                value={form.role || '__empty__'}
                onValueChange={(v) =>
                  setForm({ ...form, role: v === '__empty__' ? '' : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__empty__">无角色</SelectItem>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABEL[r] || r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
