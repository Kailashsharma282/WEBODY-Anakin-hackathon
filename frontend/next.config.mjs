/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.BACKEND_URL 
          ? `${process.env.BACKEND_URL}/api/:path*` 
          : 'http://127.0.0.1:8008/api/:path*',
      },
      {
        source: '/health',
        destination: process.env.BACKEND_URL 
          ? `${process.env.BACKEND_URL}/health` 
          : 'http://127.0.0.1:8008/health',
      },
    ];
  },
};

export default nextConfig;
