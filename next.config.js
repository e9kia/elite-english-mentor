/** @type {import('next').NextConfig} */
const nextConfig = {
  // Needed to handle large file uploads in API routes
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

module.exports = nextConfig;
