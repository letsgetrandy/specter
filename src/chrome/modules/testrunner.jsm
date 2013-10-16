/*jshint esnext:true */

var EXPORTED_SYMBOLS = ["TestRunner"];


Components.utils.import("resource://specter/utils.jsm");
Components.utils.import("resource://specter/specter.jsm");
Components.utils.import("resource://specter/configuration.jsm");

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
            specter.exit();
        }
    }
}

function process(testFile) {
    var file = Components.classes["@mozilla.org/file/local;1"].
           createInstance(Components.interfaces.nsILocalFile);
    file.initWithPath(testFile);

    //specter.testName = file.leafName.replace(/(^test[_\-])|(\.js$)/g, '');
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

    var src = Utils.readFile(file);
    Components.utils.evalInSandbox(src, sandbox);
    //specter.runTests();
}


var TestRunner = {

    handleArg: function(filename) {
        var testfile = null,
            dir = configuration.workingDirectory;
        //for (var i=0; i<validoptions.length; i++) {
        //}

        try {
            testfile = Utils.getAbsMozFile(filename, dir);

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

            // set our base directory from here
            configuration.basedir.initWithPath(testfile.path);

            // recursively loop directory and process files
            Utils.recurse(testfile, function(iFile, isDir) {
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
                configuration.basedir.initWithPath(testfile.parent.path);
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
