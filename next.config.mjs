/** @type {import('next').NextConfig} */
const nextConfig = {
        reactStrictMode: false,
     typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!

    ignoreBuildErrors: true,
     },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'placehold.co',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'api.dicebear.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'test-videos.co.uk',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '3000',
                pathname: '/uploads/**',
            },
            {
                protocol: 'https',
                hostname: 'ezperfilwebinars.com',
                port: '',
                pathname: '/uploads/**',
            },
            {
                protocol: 'https',
                hostname: 'cdn.ezperfilwebinars.com',
                port: '',
                pathname: '/**',
            }
            

        ],
    },
};

export default nextConfig;
