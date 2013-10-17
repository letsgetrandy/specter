/*jshint esnext:true */

var EXPORTED_SYMBOLS = ["TestRunner"];


Components.utils.import("resource://specter/specter.jsm");
Components.utils.import("resource://specter/configuration.jsm");
Components.utils.import("resource://specter/test_results.jsm");

const principal =
        Components.classes['@mozilla.org/systemprincipal;1']
                .createInstance(Components.interfaces.nsIPrincipal);

const httphandler =
        Components.classes["@mozilla.org/network/protocol;1?name=http"]
                .getService(Components.interfaces.nsIHttpProtocolHandler);

const timer =
        Components.classes["@mozilla.org/timer;1"]
                .createInstance(Components.interfaces.nsITimer);


var files = [];

function waitQueue() {
    if (specter.ready) {
        if (files.length) {
            var next = files.shift();
            process(next);
        } else {
            timer.cancel();
            summary();
            if (!configuration.debug) {
                specter.exit();
            }
        }
    }
}

function process(testFile) {
    var file = Components.classes["@mozilla.org/file/local;1"].
           createInstance(Components.interfaces.nsILocalFile);
    file.initWithPath(testFile);

    //specter.testName = file.leafName.replace(/(^test[_\-])|(\.js$)/g, '');
    TestResults.addTestFile(testFile);
    specter.setTestFile(file);

    var sandbox = Components.utils.Sandbox(principal, {
        sandboxName: "spectertest",
        sandboxPrototype: {
            "capture": function(selector, name) {
                specter.capture(selector, name);
            },
            "done": function() {
                specter.done();
            },
            "exit": function() {
                specter.exit();
            },
            "finish": function() {
                specter.runTests();
            },
            "log": function(s) {
                specter.log(s);
            },
            "open": function(uri, fn) {
                specter.open(uri, fn);
            },
            "perform": function(fn) {
                specter.perform(fn);
            },
            "test": function(sizes, fn) {
                specter.test(sizes, fn);
            },
            "waitFor": function(fn) {
                specter.waitFor(fn);
            },
            get window() {
                return specter.window;
            },
        },
        wantComponents: false,
        wantXrays: true
    });

    var src = readFile(file);
    Components.utils.evalInSandbox(src, sandbox);
    //specter.runTests();
}

function readFile(file) {

    let fstream =
        Components.classes["@mozilla.org/network/file-input-stream;1"]
            .createInstance(Components.interfaces.nsIFileInputStream);
    let cstream =
        Components.classes["@mozilla.org/intl/converter-input-stream;1"]
            .createInstance(Components.interfaces.nsIConverterInputStream);
    fstream.init(file, -1, 0, 0);
    cstream.init(fstream, "UTF-8", 0, 0);
    let data = '';
    let (str = {}) {
        let read = 0;
        do {
            // read as much as we can and put it in str.value
            read = cstream.readString(0xffffffff, str);
            data += str.value;
        } while (read !== 0);
    }
    cstream.close(); // this closes fstream
    return data;
}

// iterate a directory, and recurse into contained directories
// @param nsIFile  file entry
// @param function callback
function recurse(iFile, callback) {
    var items = iFile.directoryEntries;
    while (items.hasMoreElements()) {
        let item = items.getNext().QueryInterface(
                    Components.interfaces.nsIFile);
        if (item.leafName === "." || item.leafName === "..") {
            return;
        }
        //let f = item.clone().append
        if (item.exists() && item.isDirectory()) {
            if (callback(item, true)) {
                recurse(item, callback);
            }
        } else {
            if (item.isFile()) {
                callback(item, false);
            }
        }
    }
}

function summary() {
    specter.log('');
    if (TestResults.failCount) {
        specter.log('\n===================\n' +
                    '   Test failures   \n'+
                    '===================\n' +
                    TestResults.failedTests.join('\n'));
    }
    var out = [];
    out.push(TestResults.passCount + ' passed');
    out.push(TestResults.newCount + ' rebased');
    out.push(TestResults.failCount + ' failed');
    specter.log('\n' + TestResults.testCount + ' images captured in ' +
            TestResults.fileCount + ' files.\n' + out.join(', ') + '.');
}

var TestRunner = {

    handleArg: function(filename) {
        var testfile = null,
            dir = configuration.workingDirectory;
        //for (var i=0; i<validoptions.length; i++) {
        //}

        try {
            //testfile = Components.classes['@mozilla.org/file/local;1']
            //        .createInstance(Components.interfaces.nsILocalFile);
            //testfile.initWithPath(filename);
            var f = filename;
            if (f.charAt(0) !== '/') {
                f = configuration.workingDirectory.path + '/' + f;
            }
            testfile = dir.clone();
            testfile.initWithPath(f);


            //if (/Mac/i.test(httphandler.oscpu)) {
                // under MacOS, resolveFile failes with a relative path
                //try {
                //    testfile = cmdLine.resolveFile(filename);
                //} catch(ex) {
                //    testfile = Utils.getAbsMozFile(
                //          filename, configuration.workingDirectory);
                //}
            //} else {
            //    testfile = cmdLine.resolveFile(filename);
            //}
            if (!testfile.exists()) {
                dump("FileNotFound: " + filename + "\n");
                throw "FileNotFound: " + filename;
            }
        } catch(ex) {
            Components.utils.reportError(ex);
            return;
        }

        if (testfile.isDirectory()) {

            // recursively loop directory and process files
            recurse(testfile, function(iFile, isDir) {
                if (isDir) {
                    return true;
                } else {
                    if (/\.js$/.test(iFile.path)) {
                        files.push(iFile.path);
                    }
                }
            });
        } else {
            // add file to queue
            if (/\.js$/.test(testfile.path)) {
                files.push(testfile.path);
            }
        }
    },

    run: function() {
        timer.initWithCallback(waitQueue, 50, timer.TYPE_REPEATING_SLACK);
    },

    __exposedProps__ : {
        handleArg: 'r',
        processFile: 'r'
    }
};
