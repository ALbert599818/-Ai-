import { useEffect, useState } from 'react';
import { Mail, Phone, MapPin, Calendar, Shield } from 'lucide-react';
import { Badge } from '@client/src/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@client/src/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@client/src/components/ui/tabs';
import { toast } from 'sonner';
import { getMyAccount } from '@client/src/api/user-account';
import type { UserAccountInfo } from '@client/src/api/user-account';
import { useAppAuth } from '@client/src/contexts/AuthContext';
import { ROLE_LABEL } from '@shared/role';
import ProfileSection from './ProfileSection';
import PasswordSection from './PasswordSection';
import PendingTab from './PendingTab';
import CompletedTab from './CompletedTab';
import DraftsTab from './DraftsTab';
import { Image } from '@client/src/components/ui/image';

const GUEST_AVATAR =
  'https://lf3-static.bytednsdoc.com/obj/eden-cn/LMfspH/ljhwZthlaukjlkulzlp/miao/no-person.svg';

function AccountSection() {
  const { user: currentUser } = useAppAuth();
  const [account, setAccount] = useState<UserAccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchAccount = async () => {
      setLoading(true);
      try {
        const data = await getMyAccount();
        setAccount(data);
      } catch {
        toast.error('获取账号信息失败');
      } finally {
        setLoading(false);
      }
    };
    fetchAccount();
  }, [refreshKey]);

  const displayName = account?.displayName || currentUser?.displayName || '-';
  const username = account?.username || currentUser?.username || '-';
  const region = account?.region || currentUser?.region || '-';
  const roles = account?.roles || currentUser?.roles || [];
  const createdAt = account?.createdAt;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">账号信息</CardTitle>
          <CardDescription>
            您的基本身份信息，来自平台账号
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              加载中...
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Image
                src={currentUser?.avatar || GUEST_AVATAR}
                alt={displayName}
                className="size-20 shrink-0 rounded-full border border-border object-cover"
              />
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{displayName}</h2>
                  <span className="text-sm text-muted-foreground">
                    @{username}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Shield className="size-3.5" />
                    角色：
                    {roles.length > 0 ? (
                      roles.map((r) => (
                        <Badge key={r} variant="secondary" className="ml-0.5">
                          {ROLE_LABEL[r] || r}
                        </Badge>
                      ))
                    ) : (
                      <span className="ml-0.5">未分配</span>
                    )}
                  </span>
                  {region && region !== '-' && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" />
                      {region}
                    </span>
                  )}
                  {account?.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="size-3.5" />
                      {account.email}
                    </span>
                  )}
                  {account?.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="size-3.5" />
                      {account.phone}
                    </span>
                  )}
                  {createdAt && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3.5" />
                      加入于 {new Date(createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileSection refreshKey={refreshKey} />
        <PasswordSection />
      </div>

      <div className="flex justify-end">
        <span className="text-xs text-muted-foreground">
          最后刷新：
          {account?.updatedAt
            ? new Date(account.updatedAt).toLocaleString('zh-CN')
            : '-'}
        </span>
      </div>
    </div>
  );
}

export default function MyCenter() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">个人中心</h1>
        <p className="text-sm text-muted-foreground">
          查看并管理您的报价单与账号资料
        </p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">待办</TabsTrigger>
          <TabsTrigger value="completed">已办</TabsTrigger>
          <TabsTrigger value="drafts">草稿</TabsTrigger>
          <TabsTrigger value="account">账号信息</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <PendingTab />
        </TabsContent>
        <TabsContent value="completed">
          <CompletedTab />
        </TabsContent>
        <TabsContent value="drafts">
          <DraftsTab />
        </TabsContent>
        <TabsContent value="account">
          <AccountSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
