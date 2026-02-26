import { Toaster } from 'sonner';

export function ToasterConfig() {
  return (
    <Toaster
      position="top-left"
      theme="light"
      richColors
      expand={true}
      visibleToasts={3}
      gap={12}
    />
  );
}
