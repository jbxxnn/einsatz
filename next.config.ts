import {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
 
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
 
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);