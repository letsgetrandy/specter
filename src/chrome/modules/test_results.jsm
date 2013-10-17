/*jshint esnext:true */

var EXPORTED_SYMBOLS = ["TestResults"];


function pass(file) {
    dump('.');
}

function fail(file) {
    dump('F');
}

function error(file) {
    dump('E');
}

function rebase(file) {
    dump('+');
}

var TestResults = {
    pass: pass,
    fail: fail,
    error: error,
    rebase: rebase,

    __exposedProps__ : {
        error: 'r',
        fail: 'r',
        handleArg: 'r',
        pass: 'r',
        processFile: 'r',
        rebase: 'r'
    }
};
