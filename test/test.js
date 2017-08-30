import test from './test.bc'
import test2 from './test.bc?withFunctionPointers'

test.ready.then(() => {
    if (test._some_function() != 123) {
        throw new Error("expected some_function() to return 123")
    }
})

test2.ready.then(() => {
    let funcPtr = test2.Runtime.addFunction(function() {
    })
    if (test2._some_function() != 123) {
        throw new Error("expected some_function() to return 123")
    }
})
