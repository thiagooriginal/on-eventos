/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
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
};

export default nextConfig;
