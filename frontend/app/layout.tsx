import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Market Maker Dashboard',
  description: 'Solana Market Maker Bot Control Panel',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

