import { Outlet, createFileRoute } from '@tanstack/react-router';
import { Sidebar } from '../components/Sidebar';
import { useProviderSettings } from '../lib/provider-settings-context';

export const Route = createFileRoute('/_app')({
  component: AppLayout,
});

function AppLayout() {
  const { openSettings } = useProviderSettings();
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar onOpenSettings={openSettings} />
      <main className="flex-1 overflow-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
