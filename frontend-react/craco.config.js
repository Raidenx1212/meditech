const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Production optimizations only
      if (webpackConfig.mode === 'production') {
        // Optimize chunks
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          minimize: true,
          minimizer: [
            new TerserPlugin({
              terserOptions: {
                compress: {
                  drop_console: true,
                  drop_debugger: true,
                  pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
                },
                mangle: true,
                output: {
                  comments: false
                }
              }
            })
          ],
          splitChunks: {
            chunks: 'all',
            minSize: 20000,
            maxSize: 244000,
            minChunks: 1,
            maxAsyncRequests: 30,
            maxInitialRequests: 30,
            cacheGroups: {
              defaultVendors: {
                test: /[\\/]node_modules[\\/]/,
                priority: -10,
                reuseExistingChunk: true
              },
              default: {
                minChunks: 2,
                priority: -20,
                reuseExistingChunk: true
              }
            }
          }
        };

        // Add compression plugin
        webpackConfig.plugins.push(
          new CompressionPlugin({
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 10240,
            minRatio: 0.8
          })
        );

        // Add bundle analyzer in analyze mode
        if (process.env.ANALYZE === 'true') {
          webpackConfig.plugins.push(
            new BundleAnalyzerPlugin({
              analyzerMode: 'server'
            })
          );
        }
      }

      return webpackConfig;
    }
  },
  // Add modern JavaScript transpilation targets
  babel: {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            browsers: [
              'last 2 Chrome versions',
              'last 2 Firefox versions',
              'last 2 Safari versions',
              'last 2 Edge versions'
            ]
          },
          useBuiltIns: 'usage',
          corejs: 3
        }
      ]
    ]
  }
}; 