/*
 * Copyright (C) 2017-2018 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

const merge = require("webpack-merge");
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const prepareOnly = process.env["PREPARE_ONLY"] === "true";

const harpMapThemePath = path.dirname(require.resolve("@here/harp-map-theme/package.json"));
const harpFontResourcesPath = path.dirname(
    require.resolve("@here/harp-font-resources/package.json")
);

const commonConfig = {
    context: __dirname,
    devtool: prepareOnly ? undefined : "source-map",
    externals: {
        three: "THREE"
    },
    resolve: {
        extensions: [".webpack.js", ".web.ts", ".ts", ".tsx", ".web.js", ".js"]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                exclude: /node_modules/,
                options: {
                    configFile: path.join(process.cwd(), "tsconfig.json"),
                    onlyCompileBundledFiles: true,
                    transpileOnly: prepareOnly,
                    compilerOptions: {
                        sourceMap: !prepareOnly
                    }
                }
            }
        ]
    },
    output: {
        path: path.join(process.cwd(), "dist"),
        filename: "[name].bundle.js"
    },
    performance: {
        hints: false
    },
    stats: {
        all: false,
        timings: true,
        exclude: "/resources/",
        errors: true,
        entrypoints: true,
        warnings: true
    },
    mode: process.env.NODE_ENV || "development"
};

const demoBundleConfig = merge(commonConfig, {
    entry: {
        demo: "./src/demo.tsx",
    },
    plugins: [
        new CopyWebpackPlugin(
            [
                path.join(__dirname, "index.html"),
                //{ from: path.join(__dirname, "resources"), to: "resources", toType: "dir" },
                { from: path.join(harpMapThemePath, "resources"), to: "resources", toType: "dir" },
                {
                    from: path.join(harpFontResourcesPath, "resources"),
                    to: "resources/fonts",
                    toType: "dir"
                },
                require.resolve("three/build/three.min.js")
            ],
            { ignore: ["*.npmignore", "*.gitignore"] }
        )
    ]
});

const decoderBundleConfig = merge(commonConfig, {
    target: "webworker",
    entry: {
        decoder: "./src/harp-decoders.ts"
    }
});

module.exports = [demoBundleConfig, decoderBundleConfig];
