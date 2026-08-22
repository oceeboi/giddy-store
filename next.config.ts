import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'sfycdn.speedsize.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.kokolet.com',
      },
      {
        protocol: 'https',
        hostname: 'giddy-culture-media.s3.eu-west-3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'd2mcln2axj8hed.cloudfront.net',
      },
    ],
  },
};

export default nextConfig;
