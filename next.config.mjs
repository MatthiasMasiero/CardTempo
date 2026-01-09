/** @type {import('next').NextConfig} */
const nextConfig = {
  // Security: Limit request body size to prevent DoS attacks
  experimental: {
    // Set body size limit for API routes (default is 4mb in Next.js)
    // 1mb is sufficient for our use case (PDF generation, reminders)
    serverActions: {
      bodySizeLimit: '1mb',
    },
  },
};

export default nextConfig;
