/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "export",
  

  images: {
    unoptimized: true, // REQUIRED for static export
  },

  reactCompiler: true,
};

export default nextConfig;
