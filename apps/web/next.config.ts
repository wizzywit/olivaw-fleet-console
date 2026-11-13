import type { NextConfig } from 'next';

const ingestUrl = process.env.INGEST_URL ?? 'http://127.0.0.1:4000';

const nextConfig: NextConfig = {
  transpilePackages: ['@olivaw/contracts'],
  rewrites: () => Promise.resolve([{ source: '/api/:path*', destination: `${ingestUrl}/api/:path*` }]),
};

export default nextConfig;
