import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Outsight AI — Enterprise Intelligence',
  description: 'Executive-grade outsourcing, AI adoption, and vendor intelligence.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="app-header">
          <div className="brand">
            <span className="brand-dot" /> Outsight <strong>AI</strong>
          </div>
          <nav>
            <a href="/">Dashboard</a>
            <a href="/watchlist">Watchlist</a>
            <a href="/compare">Compare</a>
            <a href="/alerts">Alerts</a>
            <a href="/team">Team</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="app-footer">
          Outsight AI • Confidential • {new Date().getFullYear()}
        </footer>
      </body>
    </html>
  );
}
