/**
 * main.jsx — React app entry point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: '"Source Sans 3", sans-serif',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#1e3a5f', secondary: '#c9a84c' },
          },
        }}
      />
    </AuthProvider>
  </React.StrictMode>
);

