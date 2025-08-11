import {NextConfig} from 'next';
 
const nextConfig: NextConfig = {
  images: {
    domains: ['xycxeqbvtmofkartsqan.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xycxeqbvtmofkartsqan.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};
 
export default nextConfig;