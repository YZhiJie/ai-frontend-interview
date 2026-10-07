/** @type {import('next').NextConfig} */
const nextConfig = {
  // FS-A3 部署要点：standalone 产出可直接打进最小 Docker 镜像的独立服务
  // （.next/standalone/server.js），无需把 node_modules 整体拷进镜像
  output: 'standalone',
  reactStrictMode: true,
};

export default nextConfig;
