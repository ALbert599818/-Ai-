import { useState } from 'react';
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
import { createTestAccount } from '@client/src/api/user-account';
import { ROLE_LABEL, TEST_ACCOUNT_ROLES } from '@shared/role';

interface CreateTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormState {
  username: string;
  displayName: string;
  password: string;
  region: string;
  role: string;
}

const EMPTY_FORM: FormState = {
  username: '',
  displayName: '',
  password: '',
  region: '',
  role: 'quotation_editor',
};

const REGION_OPTIONS = ['欧美', '澳新日韩', '拉美', '东南亚', '其他地区'] as const;

export default function CreateTestDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateTestDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    setForm(EMPTY_FORM);
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!form.username.trim()) {
      toast.error('请输入用户名');
      return;
    }
    if (!form.displayName.trim()) {
      toast.error('请输入显示名');
      return;
    }
    if (!form.password || form.password.length < 6) {
      toast.error('密码长度不能少于6位');
      return;
    }

    setSaving(true);
    try {
      await createTestAccount({
        username: form.username.trim(),
        displayName: form.displayName.trim(),
        password: form.password,
        region: form.region || undefined,
        role: form.role,
      });
      toast.success('创建成功');
      handleClose();
      onSuccess();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '创建失败';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新建测试账号</DialogTitle>
          <DialogDescription>
            测试账号用于系统调试，角色仅限 {TEST_ACCOUNT_ROLES.map(r => ROLE_LABEL[r] || r).join('、')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>用户名</Label>
            <Input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="例如：test_zhangsan"
            />
          </div>

          <div className="space-y-2">
            <Label>显示名</Label>
            <Input
              value={form.displayName}
              onChange={(e) =>
                setForm({ ...form, displayName: e.target.value })
              }
              placeholder="例如：张三"
            />
          </div>

          <div className="space-y-2">
            <Label>密码</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="至少6位"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>区域</Label>
              <Select
                value={form.region || '__empty__'}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    region: v === '__empty__' ? '' : v,
                  })
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
                  setForm({
                    ...form,
                    role: v === '__empty__' ? 'quotation_editor' : v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择角色" />
                </SelectTrigger>
                <SelectContent>
                  {TEST_ACCOUNT_ROLES.map((r) => (
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
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '创建中...' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
