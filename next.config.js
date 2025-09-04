/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    domains: [
      "replicate.delivery",
      "pbxt.replicate.delivery",
      "supabase.co",
      "images.unsplash.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "iyaskfchisjuaftaxomg.supabase.co", // 您的 Supabase 项目域名
        port: "",
        pathname: "/storage/v1/object/public/gallery_images/**", // 您 Bucket 的路径
      },
    ],
  },

  // 优化构建配置
  experimental: {
    // 优化包大小
    optimizePackageImports: ["lucide-react"],
  },
  // 确保API路由不会被静态生成
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
