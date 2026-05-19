// src/main.tsx
import React from "react"
import ReactDOM from "react-dom/client"
import { AuthProvider, createDefaultAuthConfig } from "@widyatama/sso-react"
import App from "./App"
import "./index.css"
import '@widyatama/ui/style.css'

// SSO Configuration for fe-dosen
const authConfig = createDefaultAuthConfig(
  import.meta.env.VITE_AUTHENTIK_CLIENT_ID || 'fe-dosen',
  import.meta.env.VITE_AUTHENTIK_CLIENT_SECRET || '',
  `${window.location.origin}/auth/callback`,
  import.meta.env.VITE_AUTHENTIK_ISSUER_URL
)

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider config={authConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
)
