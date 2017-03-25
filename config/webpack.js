var path = require('path');

module.exports = {
    entry: ['babel-polyfill'],
    output: {
        filename: './bundle.js'
    },
    devtool: 'inline-source-map',
    resolve: {
        root: [path.join(__dirname, 'node_modules')],
        extensitions: ['', '.ts', '.webpack.js', '.web.js', '.js']
    },
    node: {
        __dirname: false,
        __filename: false
    },
    module: {
        loaders: [
            { test: /\.ts$/, loader: 'ts-loader' }
        ]
    }
}

