import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AppShell } from "@/components/navigation/AppShell";
import { auth0 } from "@/lib/auth0";
import type { AuthenticatedUser } from "@/hooks/use-authenticated-user";
import { preferencesBootScript } from "@/hooks/use-preferences";
import { Providers } from "./providers";
import "@/styles/globals.css";

const inter = localFont({
  src: "./fonts/InterVariable.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
  style: "normal",
});

export const metadata: Metadata = {
  title: {
    default: "Inventario · Finanzas personales",
    template: "%s · Inventario",
  },
  description: "¿Cuánto puedo gastar hoy sin perjudicar mis obligaciones, mi ahorro ni mi estabilidad?",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF8FF" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1020" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = auth0 ? await auth0.getSession() : null;
  const authenticatedUser = session ? sessionUser(session.user) : null;

  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Applies theme, privacy mask and sidebar width before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: preferencesBootScript }} />
      </head>
      <body>
        <Providers authenticatedUser={authenticatedUser}>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}

function sessionUser(user: { name?: string; nickname?: string; email?: string }): AuthenticatedUser | null {
  const email = user.email?.trim();
  if (!email) return null;
  const displayName = (user.name ?? user.nickname ?? email).trim() || email;
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "U";
  return { displayName, email, initials };
}
