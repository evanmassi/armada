import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { App } from '@renderer/app/App';
import { installClickFeedback } from '@renderer/app/clickFeedback';
import { queryClient } from '@renderer/app/queryClient';
import '@renderer/app/styles/index.css';

installClickFeedback();

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
);
