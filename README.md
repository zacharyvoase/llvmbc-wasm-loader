# LLVM Bytecode Loader

This package allows you to `require()` LLVM bytecode files, automatically
compiling them to JS + WebAssembly using [Emscripten][].

[emscripten]: https://kripken.github.io/emscripten-site/index.html

## Installation & Requirements

This loader itself can be installed via npm or Yarn:

    npm install llvmbc-wasm-loader

You'll also need a working Emscripten installation, as the loader shells out to
`emcc` to convert the bytecode files to JS/WASM.


## Basic usage

Create a simple C++ file:

```cpp
// mylibrary.cpp
#include <emscripten.h>

extern "C" EMSCRIPTEN_KEEPALIVE int add(int x, int y) {
  return x + y;
}
```

Use `em++` to compile it to LLVM Intermediate Representation bytecode:

```bash
$ em++ mylibrary.cpp -o mylibrary.bc
```

`require()` it from your JS file:

```js
// mylibrary.js
var lib = require('llvmbc-wasm-loader!./mylibrary.bc')

// You need to wait for this Promise to complete:
lib.ready.then(function() {
  console.log("1 + 2 = " + lib._add(1, 2));
}
```

Write a webpack config:

```js
// webpack.config.js
module.exports = {
  target: 'node',
  entry: './mylibrary.js',
  output: {
    filename: 'bundle.js'
  }
}
```

Compile with webpack:

```bash
$ webpack
```

And run the bundle with node:

```bash
$ node bundle.js
1 + 2 = 3
```


## Loader Options

### `emscriptenCommand`

This should be a list representing the `emcc` command line to be invoked to
produce the `.js` and `.wasm` files for a given input. The default is:

```js
[
  'emcc',
  // Prevents the runtime from being shutdown after invocation of a
  // `main()` function, if any. This allows for library usage.
  '-s', 'NO_EXIT_RUNTIME=1',
]
```

To all command lines, the following necessary arguments will be appended:

```js
[
  '-s', 'WASM=1', // Necessary to produce WASM output
  INFILE,
  '-o', OUTFILE
]
```

If you're using multiple distinct `emcc` invocations in your application, we
recommend using [`resourceQuery`][rq] to differentiate between them, rather
than specifying rather unwieldy commands in the loader query syntax. In your
`webpack.config.js`:

```js
module.exports = {
  // ...
  module: {
    rules: {
      {
        test: /\.bc$/,
        // `oneOf` will pick the first matching rule:
        oneOf: [
          // `import '.../foo.bc?withFunctionPointers'` will resolve to these options:
          {
            resourceQuery: /^\?withFunctionPointers$/,
            use: {
              loader: 'llvmbc-wasm-loader',
              options: {
                command: ['emcc', '-s', 'NO_EXIT_RUNTIME=1', '-s', 'RESERVED_FUNCTION_POINTERS=1']
              }
            }
          },
          // All other imports will resolve to the default config:
          {
            use: 'llvmbc-wasm-loader'
          }
        ]
      }
    }
  }
}
```

Then, from your application:

```js
import lib1 from './lib1.bc?withFunctionPointers'
import lib2 from './lib2.bc'

// ...
```

[rq]: https://webpack.js.org/configuration/module/#rule-resourcequery


## License

This library is released under the Unlicense:

> This is free and unencumbered software released into the public domain.
>
> Anyone is free to copy, modify, publish, use, compile, sell, or
> distribute this software, either in source code form or as a compiled
> binary, for any purpose, commercial or non-commercial, and by any
> means.
>
> In jurisdictions that recognize copyright laws, the author or authors
> of this software dedicate any and all copyright interest in the
> software to the public domain. We make this dedication for the benefit
> of the public at large and to the detriment of our heirs and
> successors. We intend this dedication to be an overt act of
> relinquishment in perpetuity of all present and future rights to this
> software under copyright law.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
> EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
> MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
> IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
> OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
> ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
> OTHER DEALINGS IN THE SOFTWARE.
>
> For more information, please refer to <http://unlicense.org/>
