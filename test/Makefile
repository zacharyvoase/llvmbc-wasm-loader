test: bundle.js
	node bundle.js

bundle.js: test.bc test.js
	webpack --debug

test.bc: test.cpp
	em++ test.cpp -o test.bc

.PHONY: test
