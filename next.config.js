/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['raw.githubusercontent.com']
  },
  // Ensure the bundled font TTFs are traced into the /api/render
  // serverless function on Vercel — otherwise rendering works locally
  // but fails on deploy (the recurring failure mode in prior versions).
  experimental: {
    outputFileTracingIncludes: {
      '/api/render': ['./assets/fonts/**']
    }
  }
}
module.exports = nextConfig
