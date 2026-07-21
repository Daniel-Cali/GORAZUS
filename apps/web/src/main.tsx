import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { configureApiClient } from '@gorazus/ui-kit';
import { AppProviders } from './app/providers';
import './styles/globals.css';

/** Punto de entrada — monta <App/>, nada de lógica de negocio (FOLDER_STRUCTURE.md §1). */
configureApiClient({ baseUrl: import.meta.env.VITE_API_URL ?? '/api/v1' });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>,
);
