/*jshint esnext:true */

var EXPORTED_SYMBOLS = ["specter"];

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://specter/configuration.jsm");
Components.utils.import("resource://specter/progress_listener.jsm");
Components.utils.import("resource://specter/imagelib.jsm");
Components.utils.import("resource://specter/test_results.jsm");

const windowMediator =
        Components.classes["@mozilla.org/appshell/window-mediator;1"]
                .getService(Components.interfaces.nsIWindowMediator);

const xulAppInfo =
        Components.classes["@mozilla.org/xre/app-info;1"]
                .getService(Components.interfaces.nsIXULAppInfo);

const dirsvc =
        Components.classes["@mozilla.org/file/directory_service;1"]
                .getService(Components.interfaces.nsIProperties);

const timer =
        Components.classes["@mozilla.org/timer;1"]
                .createInstance(Components.interfaces.nsITimer);


var [major, minor, patch] = xulAppInfo.version.split('.');
var _version = {
    major: checkInt(major),
    minor: checkInt(minor),
    patch: checkInt(patch),
    __exposedProps__ : {
        major:'r',
        minor:'r',
        patch:'r'
    }
};
function checkInt(val) {
    let v = parseInt(val)
    if (isNaN(v))
        return 0;
    return v;
}


Services.prefs.setBoolPref('browser.dom.window.dump.enabled', true);

var parentwin, window, browser, loaded=false, pagedone=true;
var queue=[], testFile, testName, pagesize;

// convenience function
function $(selector) {
    var doc = browser.contentWindow.wrappedJSObject.document;
    return doc.querySelector(selector);
}

// capture an element, given its selector
function capture(selector, filename) {

    // find the element on screen or exit
    var clip,
        el = $(selector);
    if (el) {
        clip = el.getBoundingClientRect();
    } else {
        log("NotFoundError: Unable to capture '" + selector + "'.");
        return;
    }

    if (!configuration.testroot.contains(testFile, false)) {
        log('ConfigError: Test files are not within "testroot".');
        exit(-255);
    }
    // determine the relative path to the test file from the base dir
    let _dirs = [], _testfile = testFile.parent.clone();
    while (!_testfile.equals(configuration.testroot)) {
        _dirs.unshift(_testfile.leafName);
        _testfile = _testfile.parent;
    }

    // build the name of the capture file
    var capture_name = [testName, filename, pagesize].join('-');

    // determine the expected location of the baseline image
    var baseline = configuration.baseline.clone();
    for (let i=0; i<_dirs.length; i++) {
        baseline.append(_dirs[i]);
    }
    baseline.append(capture_name + '.png');

    if (configuration.rebase) {
        baseline.remove(false);
    }

    if (baseline.exists()) {
        // capture and compare
        let content = imagelib.capture(window, clip, null);
        let blob = File(baseline);
        basedata = imagelib.createImage(blob);
        let diff = imagelib.compare(content, basedata);
        if (diff) {
            let diffFile = configuration.diffdir.clone();
            for (let i=0; i<_dirs.length; i++) {
                diffFile.append(_dirs[i]);
            }
            diffFile.append(capture_name + '-diff.png');
            imagelib.saveCanvas(diff, diffFile);
            //window.document.append(diff);
            TestResults.fail(_dirs.join('/') + '/' + capture_name + '-diff.png');
        } else {
            TestResults.pass(capture_name);
        }
    } else {
        // capture and save
        var content = imagelib.capture(window, clip, baseline);
        TestResults.rebase(capture_name);
    }
    return;
}

function exit(code) {
    dump("\n");
    let c = code || 0;
    data = 'exit ' + c;

    try {
        var file = Components.classes["@mozilla.org/file/local;1"]
                       .createInstance(Components.interfaces.nsILocalFile);
        file.initWithPath(configuration.outfile);
        if (!file.exists()) {
            file.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE,
                parseInt('0666', 8));
        }
        var fstream =
                Components.classes["@mozilla.org/network/file-output-stream;1"]
                    .createInstance(Components.interfaces.nsIFileOutputStream);
        fstream.init(file, 2, 0x200, false);
        var cstream =
                Components.classes["@mozilla.org/intl/converter-output-stream;1"]
                    .createInstance(Components.interfaces.nsIConverterOutputStream);
        cstream.init(fstream, 'UTF-8', data.length,
                Components.interfaces.nsIConverterInputStream.DEFAULTREPLACEMENT_CHARACTER);
        cstream.writeString(data);
        cstream.close();
        fstream.close();
    //} catch(ex) {
    //    log('oops');
    //    log(ex);
    } finally {
        Services.startup.quit(Components.interfaces.nsIAppStartup.eForceQuit);
    }
}

function log(s) {
    dump(s + "\n");
}

function open(uri, callback) {
    loaded = false;
    pagedone = false;

    if (!parentwin) {
        parentwin = windowMediator.getMostRecentWindow("specter");
    }
    let features = "chrome,dialog=no,scrollbars=yes";
        features += ",width=1000,height=500";

    ProgressListener.setListener(function(){
        loaded = true;
        ProgressListener.setListener(function(){});
        callback();
    });
    window = parentwin.openDialog(
            "chrome://specter/content/webpage.xul",
            "_blank", features, { callback:function(b){

        browser = b;
        b.addProgressListener(ProgressListener,
            Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);

        try {
            browser.loadURI(uri, null, null);
            //browser.webNavigation.loadURI(uri,
            //    0, null, null, null);
        } catch(ex) {
            log(ex);
            loaded = true;
            pagedone = true;
        }
    }});
}

function perform(fn) {
    queue.push(fn.bind(specter));
}

function taskready() {
    return true;
}

function dequeue() {
    var fn;
    if (taskready()) {
        if (fn = queue.shift()) {
            fn();
        } else {
            timer.cancel();
            window.close();
            pagedone = true;
        }
    }
}

function runTests(){
    timer.initWithCallback(dequeue, 50, timer.TYPE_REPEATING_SLACK);
}

function setViewport(width, height) {
    window.resizeTo(width, height);
}

function test(sizes, testFunc) {
    if (({}).toString.call(sizes).indexOf("Array") < 0) {
        sizes = [sizes];
    }
    for (let size in sizes) {
        let mysize = sizes[size];

        queue.push(function(){
            pagesize = mysize;
            let s = pagesize.split(/[x:,-]/);
            if (s.length > 1) {
                setViewport(s[0], s[1]);
            } else {
                setViewport(s[0], 400);
            }
        });
        queue.push(testFunc);
    }
}

function wait (delay) {
    var start = new Date();
    queue.push(function(){
        taskready = function() {
            return (new Date() - start) > delay;
        };
    });
}

function waitFor(readyFn) {
    queue.push(function(){
        taskready = function() {
            if (readyFn()) {
                taskready = function() { return true; };
            }
        };
    }.bind(specter));
}

var specter = {

    capture: capture,

    // clear all current FTP/HTTP authentication sessions
    clearHttpAuth : function() {
        // clear all auth tokens
        let sdr = Components.classes["@mozilla.org/security/sdr;1"]
                    .getService(Components.interfaces.nsISecretDecoderRing);
        sdr.logoutAndTeardown();
        // clear FTP and plain HTTP auth sessions
        Services.obs.notifyObservers(null, "net:clear-active-logins", null);
    },

    click: function(selector) {
        //
    },

    get config() {
        return configuration;
    },

    exit: exit,

    log: log,

    open: open,

    perform: perform,

    get ready() {
        return pagedone;
    },

    runTests: runTests,

    test: test,

    turn_off_animations: function() {
        //
    },

    setTestFile: function(file) {
        testFile = file;
        testName = file.leafName.replace(/(^test[_\-])|(\.js$)/g, '');
    },

    get version() {
        return _version;
    },

    viewport: function(w, h) {
        //page.viewportSize({width: w, height: h});
    },

    wait: wait,

    waitFor: waitFor,

    get window() {
        try {
            return browser.contentWindow.wrappedJSObject;
        } catch (ex) {
            return null;
        }
    },

    __exposedProps__ : {
        capture: 'r',
        config: 'r',
        debug: 'r',
        exit: 'r',
        log: 'r',
        open: 'r',
        ready: 'r',
        runTests: 'r',
        setTestFile: 'r',
        test: 'r',
        testName: 'rw',
        turn_off_animations: 'r',
        version: 'r',
        viewport: 'r',
        wait: 'r',
        waitFor: 'r'
    }
};
