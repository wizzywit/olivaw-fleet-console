import { Inter, JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import '../styles/tokens.css';
import '../styles/global.css';
import { Providers } from './Providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' });

export function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
