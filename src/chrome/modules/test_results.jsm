/*jshint esnext:true */

var EXPORTED_SYMBOLS = ["TestResults"];


var files={}, testcount=0, passcount=0, failcount=0, failures=[],
    newcount=0, errorcount=0, errors=[];

function pass(file) {
    passcount++;
    testcount++;
    dump('.');
}

function fail(file) {
    failcount++;
    testcount++;
    failures.push(file);
    dump('F');
}

function error(file) {
    errorcount++;
    errors.push(file);
    dump('E');
}

function rebase(file) {
    newcount++;
    testcount++;
    dump('+');
}

function addTestFile(path) {
    files[path] = 1;
}

var TestResults = {
    pass: pass,
    fail: fail,
    error: error,
    rebase: rebase,

    get failedTests() {
        return failures;
    },

    get fileCount() {
        var i=0;
        for (f in files) { i++; }
        return i;
    },

    get testCount() {
        return testcount;
    },

    get passCount() {
        return passcount;
    },

    get newCount() {
        return newcount;
    },

    get failCount() {
        return failcount;
    },

    get errorCount() {
        return errorcount;
    },

    addTestFile: addTestFile,

    __exposedProps__ : {
        addTestFile: 'r',
        error: 'r',
        errorCount: 'r',
        fail: 'r',
        failCount: 'r',
        failedTests: 'r',
        newCount: 'r',
        pass: 'r',
        passCount: 'r',
        rebase: 'r',
        testCount: 'r'
    }
};
