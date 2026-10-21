/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // The app is live: old "join the waitlist" links go straight to the download page.
      { source: "/waitlist", destination: "/download", permanent: true },
    ];
  },
};

export default nextConfig;
