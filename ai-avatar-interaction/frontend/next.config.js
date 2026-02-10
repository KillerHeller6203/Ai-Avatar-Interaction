/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: "/ws", destination: "http://localhost:8000/ws" },
    ];
  },
};

module.exports = nextConfig;
