module.exports = {
  // ...existing code...
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
      test: /canvas\.node$/,
      use: "null-loader",
    });
    config.module.rules.push({
      test: /\.node$/,
      use: "null-loader",
    });
    config.module.rules.push({
      test: /\.pdf$/,
      type: "asset/resource",
    });
    // ...existing code...
    return config;
  },
};