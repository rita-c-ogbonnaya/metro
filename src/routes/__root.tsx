import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import { AppThemeProvider } from "@/lib/theme-context";
import { RoleProvider } from "@/lib/role-context";
import { MockStoreProvider } from "@/lib/mock-store";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 64, fontWeight: 700, margin: 0 }}>404</h1>
        <p style={{ marginTop: 8, color: "#9CA3AF" }}>This page doesn't exist.</p>
        <Link to="/manager" style={{ marginTop: 16, display: "inline-block", padding: "8px 16px", borderRadius: 8, background: "#1A56DB", color: "white", textDecoration: "none" }}>
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Metro Manaja — Real Estate & Facilities Management" },
      { name: "description", content: "Manage properties, landlords, and tenants from a unified dashboard. Powered by Manaja." },
      { property: "og:title", content: "Metro Manaja" },
      { property: "og:description", content: "Real estate & facilities management for property managers, landlords, and tenants." },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/manajalogo.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

// Runs before React hydrates so the saved theme class is on <html> from the
// first paint. Prevents the dark→light flash and stops the perceived
// self-switching when navigating between routes.
const themeBootstrap = `
(function(){try{
  var m = localStorage.getItem('metro-theme');
  if (m !== 'light' && m !== 'dark') m = 'dark';
  var r = document.documentElement;
  r.classList.remove('light','dark');
  r.classList.add(m);
  r.dataset.theme = m;
  r.style.colorScheme = m;
}catch(e){}})();
`;

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AppThemeProvider>
      <RoleProvider>
        <MockStoreProvider>
          <Outlet />
          <Toaster position="bottom-right" richColors closeButton />
        </MockStoreProvider>
      </RoleProvider>
    </AppThemeProvider>
  );
}
