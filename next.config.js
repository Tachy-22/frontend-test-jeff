/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
    };
    config.module.rules.push({
      test: /pdf\.worker(\.min)?\.js$/,
      type: "asset/resource",
    });
    config.module.rules.push({
      test: /\.node$/,
      use: 'ignore-loader', // Or use the empty module approach below if ignore-loader isn't available
      // Alternative approach without requiring null-loader:
      // loader: 'string-replace-loader',
      // options: {
      //   search: '.*',
      //   replace: 'module.exports = {};',
      //   flags: 'g'
      // }
    });
    config.module.rules.push({
      test: /\.pdf$/,
      type: "asset/resource",
    });
    // Handle canvas module and bindings.js
    config.module.rules.push({
      test: /node_modules\/canvas|node_modules\\canvas|bindings/,
      use: 'null-loader',
    });
    
    return config;
  },
}

module.exports = nextConfig;