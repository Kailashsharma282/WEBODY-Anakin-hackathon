/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backendPort = process.env.BACKEND_PORT || process.env.PORT || '8008';
    const targetUrl = process.env.BACKEND_URL || `http://127.0.0.1:${backendPort}`;
    return [
      {
        source: '/api/:path*',
        destination: `${targetUrl}/api/:path*`,
      },
      {
        source: '/health',
        destination: `${targetUrl}/health`,
      },
    ];
  },
};

export default nextConfig;
