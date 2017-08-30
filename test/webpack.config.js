module.exports = {
    target: 'web',
    entry: "./test.js",
    output: {
        path: __dirname,
        filename: "bundle.js"
    },
    module: {
        rules: [
            {
                test: /\.bc$/,
                oneOf: [
                    {
                        resourceQuery: /^\?withFunctionPointers$/,
                        use: [
                            {
                                loader: '..',
                                options: {
                                    command: ['emcc', '-s', 'NO_EXIT_RUNTIME=1', '-s', 'RESERVED_FUNCTION_POINTERS=10']
                                }
                            }
                        ]
                    },
                    {
                        use: '..'
                    }
                ]
            }
        ]
    },
    node: {
        fs: 'empty',
        path: 'empty'
    }
}
