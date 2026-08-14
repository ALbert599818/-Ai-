import React from 'react';

/**
 * 替代 @lark-apaas/client-toolkit/components/AppContainer。
 * 主题样式全部由 tailwind-theme.css 的 CSS 变量提供，这里仅做透传。
 */
export function AppContainer({
  children,
}: {
  children: React.ReactNode;
  defaultTheme?: string;
}): React.ReactElement {
  return <>{children}</>;
}

/** 替代 @lark-apaas/client-toolkit/components/ErrorRender。 */
export function ErrorRender({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}): React.ReactElement {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <h1 className="text-xl font-semibold text-foreground">页面出错了</h1>
      <pre className="max-w-2xl whitespace-pre-wrap rounded-sm border border-border bg-card p-4 text-sm text-muted-foreground">
        {error?.message ?? String(error)}
      </pre>
      <button
        type="button"
        className="rounded-sm bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
        onClick={resetErrorBoundary}
      >
        重试
      </button>
    </div>
  );
}

/** 替代 @lark-apaas/client-toolkit/components/NotFoundRender。 */
export function NotFoundRender(): React.ReactElement {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <h1 className="text-4xl font-bold text-foreground">404</h1>
      <p className="text-sm text-muted-foreground">页面不存在</p>
      <a
        href="/"
        className="rounded-sm bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
      >
        返回首页
      </a>
    </div>
  );
}
