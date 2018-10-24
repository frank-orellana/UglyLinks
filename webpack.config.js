var path = require('path');

module.exports = {
    mode : "development",
    entry: {
        "content": "./src/uglylinks.webpack.ts"
    },
    output: {
        path: path.resolve(__dirname, 'extension/js'),
        filename: "uglylinks.js"
    },
    resolve: {
        // Add '.ts' and '.tsx' as a resolvable extension.
        extensions: [".webpack.ts",".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
    },
    module: {
        rules: [
            // all files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'
            {
                test: /\.tsx?$/, loader: "ts-loader"
            }
        ]
    },
    devtool: "inline-source-map"
}