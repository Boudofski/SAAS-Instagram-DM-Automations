/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "scontent-iad3-1.cdninstagram.com",
      "scontent-iad3-2.cdninstagram.com",
      "scontent.cdninstagram.com",
    ],
  },
  async redirects() {
    return [
      {
        source: "/ap3k-admin",
        destination: "/admin/overview",
        permanent: true,
      },
      {
        source: "/ap3k-admin-v2",
        destination: "/admin/overview",
        permanent: true,
      },
      {
        source: "/ap3k-admin-v2/:path*",
        destination: "/admin/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
