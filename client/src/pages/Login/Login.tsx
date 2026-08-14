import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, ShieldCheck } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Label } from '@client/src/components/ui/label';
import { toast } from 'sonner';
import { useAppAuth } from '@client/src/contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAppAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleLogin = async () => {
    if (!username.trim()) {
      toast.error('请输入用户名');
      return;
    }
    if (!password) {
      toast.error('请输入密码');
      return;
    }
    setSubmitting(true);
    try {
      await login(username, password);
      toast.success('登录成功');
      navigate('/', { replace: true });
    } catch (error: unknown) {
      let msg = '登录失败，请检查用户名和密码';
      if (error && typeof error === 'object') {
        const axiosErr = error as {
          response?: {
            data?: {
              error?: { message?: string };
              message?: string;
            };
          };
          message?: string;
        };
        if (axiosErr.response?.data?.error?.message) {
          msg = axiosErr.response.data.error.message;
        } else if (axiosErr.response?.data?.message) {
          msg = axiosErr.response.data.message;
        }
      }
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <span className="text-sm text-muted-foreground">加载中...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center bg-foreground relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative z-10 text-center px-12">
          <div className="flex items-center justify-center mb-6">
            <ShieldCheck className="size-10 text-white/70" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-4">
            智能报价系统
          </h1>
          <p className="text-lg text-white/60">
            精准管理6大维度折扣系数
          </p>
          <div className="mt-8 flex items-center justify-center gap-6">
            <div className="h-px w-16 bg-white/20" />
            <span className="text-xs text-white/40 uppercase tracking-widest font-mono">
              Quotation Engine
            </span>
            <div className="h-px w-16 bg-white/20" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              登录
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              输入账号和密码登录系统
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                用户名
              </Label>
              <Input
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                className="rounded-sm"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                密码
              </Label>
              <Input
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="rounded-sm"
              />
            </div>
            <Button
              className="w-full rounded-sm gap-2"
              onClick={handleLogin}
              disabled={submitting}
            >
              <LogIn className="size-4" />
              {submitting ? '登录中...' : '登录'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
