import type { Metadata } from "next";
import { ProjectStoreProvider } from "@/lib/project-store";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "DAC | Doble Altura Control",
  description: "Sistema Integral de Gestion de Obras de Doble Altura Construcciones S.A.S.",
  icons: {
    icon: [
      { url: "/favicon.png" },
      { url: "/branding/favicon.png" }
    ],
    apple: "/branding/favicon.png"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <ProjectStoreProvider>{children}</ProjectStoreProvider>
      </body>
    </html>
  );
}
