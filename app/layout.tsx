import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RNA Lisp Interpreter',
  description: 'Biological computing: where codons meet code',
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
