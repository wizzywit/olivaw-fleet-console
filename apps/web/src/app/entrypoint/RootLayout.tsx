import { Inter, JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { connection } from 'next/server';
import { prefetchFleetSnapshot } from '@/entities/fleet';
import { readThemeCookie } from '@/features/toggle-theme';
import '../styles/tokens.css';
import '../styles/global.css';
import { Providers } from './Providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' });

export async function RootLayout({ children }: { children: ReactNode }) {
  // Fleet data is live, so every request renders fresh instead of using a snapshot frozen at build time.
  await connection();
  const dehydratedState = await prefetchFleetSnapshot();
  // An absent cookie leaves data-theme off, so CSS follows the system preference without any script.
  const theme = readThemeCookie(await cookies());
  return (
    <html lang="en" data-theme={theme ?? undefined} className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <Providers dehydratedState={dehydratedState} theme={theme}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
