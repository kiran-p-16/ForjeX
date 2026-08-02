import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import { ThemeProvider, BaseStyles } from '@primer/react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './authContext.jsx'
import ProjectRoutes from './Routes.jsx'
import './index.css'

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <BaseStyles>
          <AuthProvider>
            <Router>
              <ProjectRoutes />
            </Router>
          </AuthProvider>
        </BaseStyles>
      </ThemeProvider>
    </GoogleOAuthProvider>
);
