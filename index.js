const child_process = require('child_process')
const fs = require('fs')
const loaderUtils = require('loader-utils')
const path = require('path')
const shellEscape = require('shell-escape')
const tmp = require('tmp')

const defaultOptions = {
    command: [
        'emcc', '-s', 'NO_EXIT_RUNTIME=1'
    ]
}

module.exports = function(source) {
    const callback = this.async()

    const opts = Object.assign({}, defaultOptions, loaderUtils.getOptions(this))

    const tmpDir = tmp.dirSync({ unsafeCleanup: true });

    bcDigest = loaderUtils.getHashDigest(source, 'sha1', 'hex', 16);

    const outFile = path.join(tmpDir.name, "compiled." + bcDigest + ".js")
    const outWasm = path.join(tmpDir.name, "compiled." + bcDigest + ".wasm")

    const command = opts.command.concat([this.resourcePath, '-o', outFile, '-s', 'WASM=1'])
    if (this.debug) {
        console.log(shellEscape(command))
    }

    child_process.exec(shellEscape(command), { cwd: this.context }, (err, stdout, stderr) => {
        if (err) {
            return callback(err, null);
        }
        const out = fs.readFileSync(outFile);
        const binaryWasm = fs.readFileSync(outWasm);
        const encodedWasm = binaryWasm.toString('base64');
        const moduleSrc = `
        var b64chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

        var lookup = new Uint8Array(256);
        for (var i = 0; i < b64chars.length; i++) {
          lookup[b64chars.charCodeAt(i)] = i;
        }

        var decode = function(length, b64) {
            var arrayBuffer = new ArrayBuffer(length);
            var bytes = new Uint8Array(arrayBuffer);
            var p = 0, enc1, enc2, enc3, enc4;

            for (i = 0; i < b64.length; i+= 4) {
                enc1 = lookup[b64.charCodeAt(i)];
                enc2 = lookup[b64.charCodeAt(i + 1)];
                enc3 = lookup[b64.charCodeAt(i + 2)];
                enc4 = lookup[b64.charCodeAt(i + 3)];
                bytes[p++] = (enc1 << 2) | (enc2 >> 4);
                bytes[p++] = ((enc2 & 15) << 4) | (enc3 >> 2);
                bytes[p++] = ((enc3 & 3) << 6) | (enc4 & 63);
            }

            return arrayBuffer;
        }

        module.exports = (function() {
            var Module = {}, readyResolve;

            Module['ready'] = new Promise((resolve, reject) => {
                readyResolve = resolve;
            });

            Module['onRuntimeInitialized'] = () => readyResolve();

            Module['wasmBinary'] = decode(${binaryWasm.length}, "${encodedWasm}");

            ${out}

            return Module;
        })();
        `;
        tmpDir.removeCallback();
        callback(null, moduleSrc);
    });
}
