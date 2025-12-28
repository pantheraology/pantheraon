import { BRAND } from '@/config/brand';

interface BootstrapLoaderProps {
  error?: string | null;
}

export const BootstrapLoader = ({ error }: BootstrapLoaderProps) => {
  if (error) {
    return (
      <div className="min-h-dvh grid place-items-center bg-background text-foreground p-6">
        <div className="max-w-md text-center space-y-2">
          <h1 className="text-xl font-semibold">{BRAND.APP_NAME}</h1>
          <p className="text-sm text-muted-foreground">
            {error}. Please refresh in a few seconds.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh grid place-items-center bg-background text-foreground p-6">
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
};
