/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Cesium viewer lifecycle is managed manually; avoid double-init in dev.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
