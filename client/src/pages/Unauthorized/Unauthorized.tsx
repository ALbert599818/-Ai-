import { useNavigate } from 'react-router-dom';
import { Button } from '@client/src/components/ui/button';
import { LogIn, Home } from 'lucide-react';

export default function Unauthorized() {
  const navigate = useNavigate();

  const handleRelogin = () => {
    localStorage.removeItem('auth_token');
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <h1 className="text-2xl font-semibold text-foreground mb-2">
        无访问权限
      </h1>
      <p className="text-sm text-muted-foreground mb-2">
        您没有权限访问该页面，请联系管理员分配角色。
      </p>
      <p className="text-xs text-muted-foreground mb-6 max-w-md text-center">
        如果您刚被分配了角色，请点击「重新登录」以获取最新权限。
      </p>
      <div className="flex items-center gap-3">
        <Button onClick={handleRelogin} className="gap-1.5">
          <LogIn className="size-4" />
          重新登录
        </Button>
        <Button variant="outline" onClick={() => navigate('/', { replace: true })} className="gap-1.5">
          <Home className="size-4" />
          返回首页
        </Button>
      </div>
    </div>
  );
}
