import { NextConfig } from "next";

const nextConfig = (): NextConfig => {
    return {
        reactStrictMode: true,
        // Allow cross-origin requests from Saleor Dashboard and Cloudflare tunnels in development
        allowedDevOrigins: [
            "*.trycloudflare.com",
            "localhost",
            "127.0.0.1",
        ],
        transpilePackages: [
            "@saleor/apps-shared",
            "@saleor/apps-ui",
            "@saleor/react-hook-form-macaw",
        ],
        bundlePagesRouterDependencies: true,
        serverExternalPackages: [
            /*
             * The deps below have node-related features. When the flag "bundlePagesExternals" is enabled, They raise errors,
             * So we must explicitly declare them as externals.
             * more info: https://nextjs.org/docs/app/api-reference/next-config-js/serverExternalPackages
             */
            "handlebars",
            "mjml",
        ],
        webpack: (config, { isServer }) => {
            if (isServer) {
                // Ignore mjml warnings - https://github.com/open-telemetry/opentelemetry-js/issues/4173
                config.ignoreWarnings = [{ module: /mjml/ }];
            }

            /*
             * html-minifier/uglify-js loading issue: https://github.com/mjmlio/mjml/issues/2132
             * Remove when mjml 5 is released: https://github.com/mjmlio/mjml/issues/2132#issuecomment-753010828
             */
            config.module.rules.push({
                test: /html-minifier/,
                use: "null-loader",
            });

            /*
             * When the flag "bundlePagesExternals" is enabled, handlebars cannot be properly loaded,
             * so we must explicitly declare what file we load.
             */
            config.resolve.alias = {
                ...config.resolve.alias,
                handlebars: "handlebars/dist/handlebars.js",
            };

            return config;
        },
    };
};

export default nextConfig();
