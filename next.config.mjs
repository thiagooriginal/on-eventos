/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  allowedDevOrigins: [
    'cancer-johns-cornell-papers.trycloudflare.com',
    '*.trycloudflare.com',
    'localhost:3005',
    '127.0.0.1:3005',
    '*.loca.lt',
  ],
  turbopack: {},
  experimental: {
    agentUpgrade: 'security',
  },
};

export default nextConfig;
