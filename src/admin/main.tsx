import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/tailwind.css';
import '../app/globals.css';
import { AdminApp } from './AdminApp';

createRoot(document.getElementById('admin-root')!).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>
);
