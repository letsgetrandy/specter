/*jshint esnext:true */

var EXPORTED_SYMBOLS = ["configuration"];

var configuration = {

    args: [],
    ignoreSSLErrors: false,
    logFile: 'foo',
    scriptFile: '',
    testFiles: [],
    workingDirectory: '',

    handleFlags: function(foo) {
        //bar
    },
    setEnvNames: function(foo) {
        //bar
    },

    __exposedProps__ : {
        args: 'rw',
        ignoreSSLErrors: 'rw',
        logFile: 'rw',
        scriptFile: 'rw',
        setEnvNames: 'r',
        testFiles: 'rw',
        workingDirectory: 'rw'
    }
};
