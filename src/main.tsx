import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './lib/AuthContext.tsx';
import { PartnerProvider } from './lib/PartnerContext.tsx';
import { NotificationProvider } from './lib/NotificationContext.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';

// Register PWA service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    import('virtual:pwa-register').then(({ registerSW }) => {
      registerSW({ immediate: true })
    }).catch(() => {});
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <PartnerProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </PartnerProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
