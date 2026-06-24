import React from "react"
import ReactDOM from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider, createDefaultAuthConfig } from "@widyatama/sso-react"
import App from "./App"
import "./index.css"
import '@widyatama/ui/style.css'

const authConfig = createDefaultAuthConfig(
  import.meta.env.VITE_AUTHENTIK_CLIENT_ID || 'fe-dosen',
  import.meta.env.VITE_AUTHENTIK_CLIENT_SECRET || '',
  `${window.location.origin}/auth/callback`,
  import.meta.env.VITE_AUTHENTIK_ISSUER_URL
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
})

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider config={authConfig}>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
