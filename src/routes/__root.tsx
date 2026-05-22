import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { ProviderSettingsProvider, useProviderSettings } from '../lib/provider-settings-context';
import { ProviderWizard } from '../components/ProviderWizard';
import { saveProviderSettings } from '../lib/server/provider-settings-server';

import appCss from '../styles.css?url';

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Careers Builder',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
});

function RootContent({ children }: { children: React.ReactNode }) {
  const { isWizardOpen, isSettingsOpen, closeWizard, closeSettings } = useProviderSettings();

  return (
    <>
      {children}
      {isWizardOpen && (
        <ProviderWizard
          dismissable={false}
          onSave={async (settings) => {
            await saveProviderSettings(settings);
            closeWizard();
          }}
        />
      )}
      {isSettingsOpen && (
        <ProviderWizard
          dismissable
          onDismiss={closeSettings}
          onSave={async (settings) => {
            await saveProviderSettings(settings);
            closeSettings();
          }}
        />
      )}
    </>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]">
        <ProviderSettingsProvider>
          <Header />
          <RootContent>{children}</RootContent>
          <Footer />
        </ProviderSettingsProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
