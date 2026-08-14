import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Label } from '@client/src/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@client/src/components/ui/card';
import { toast } from 'sonner';
import {
  getMyAccount,
  updateMyAccount,
} from '@client/src/api/user-account';
import type { UserAccountInfo } from '@client/src/api/user-account';

interface ProfileSectionProps {
  refreshKey: number;
}

interface FormState {
  displayName: string;
  email: string;
  phone: string;
}

export default function ProfileSection({ refreshKey }: ProfileSectionProps) {
  const [account, setAccount] = useState<UserAccountInfo | null>(null);
  const [form, setForm] = useState<FormState>({
    displayName: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAccount = async () => {
    setLoading(true);
    try {
      const data = await getMyAccount();
      setAccount(data);
      setForm({
        displayName: data.displayName || '',
        email: data.email || '',
        phone: data.phone || '',
      });
    } catch {
      toast.error('获取个人资料失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccount();
  }, [refreshKey]);

  const handleSave = async () => {
    if (!form.displayName.trim()) {
      toast.error('显示名不能为空');
      return;
    }
    setSaving(true);
    try {
      await updateMyAccount({
        displayName: form.displayName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      toast.success('保存成功');
      fetchAccount();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '保存失败';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !account) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">个人资料</CardTitle>
          <CardDescription>加载中...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">个人资料</CardTitle>
        <CardDescription>
          修改您的显示名、邮箱和手机号
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          账号：{account?.username}（不可修改）
        </div>

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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 size-4" />
            {saving ? '保存中...' : '保存修改'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
