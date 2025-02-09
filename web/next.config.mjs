/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    distDir: process.env.NEXT_PUBLIC_NODE_ENV === 'prod' ? '../api/static' : '.next'
};

export default nextConfig;
