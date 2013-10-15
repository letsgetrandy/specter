/*jshint esnext:true */

var EXPORTED_SYMBOLS = ["specter"];

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://specter/Utils.jsm");
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

var currentWorkingDirectory =
        dirsvc.get("CurWorkD", Components.interfaces.nsIFile);


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

//var libPath = slConfiguration.scriptFile.parent.clone();
//var errorHandler;
//var defaultSettings = null;

Services.prefs.setBoolPref('browser.dom.window.dump.enabled', true);

var parentwin, window, browser, loaded=false, pagedone=true;
var queue=[], testName, pagesize;

// convenience function
function $(selector) {
    var doc = browser.contentWindow.wrappedJSObject.document;
    return doc.querySelector(selector);
}

// capture an element, given its selector
function capture(selector, filename) {

    var name = testName + '-' + filename + '-' + pagesize;
    var file = currentWorkingDirectory.clone();
    file.append(name + '.png');
    var exists = file.exists();

    var clip,
        el = $(selector);
    if (el) {
        clip = el.getBoundingClientRect();
    } else {
        log("NotFoundError: Unable to capture '" + selector + "'.");
        return;
    }
    // capture the image data
    var content = imagelib.capture(window, clip, exists ? null : file);

    // try to read baseline
    var baseline = null;
    if (exists) {
        var blob = File(file);
        baseline = imagelib.createImage(blob);
    }
    if (!baseline) {
        TestResults.rebase(name);
    } else {
        // compare
        let diff = imagelib.compare(content, baseline);
        if (diff) {
            let out = currentWorkingDirectory.clone();
            out.append(name + '-diff.png');
            imagelib.saveCanvas(diff, out);
            //window.document.append(diff);
            TestResults.fail(name);
        } else {
            TestResults.pass(name);
        }
    }
    return true;
}

function exit(code) {
    dump("\n");
    let c = code || 0;
    Services.startup.quit(Components.interfaces.nsIAppStartup.eForceQuit);
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
    queue.push(fn);
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

function waitFor(readyFn) {
    queue.push(function(){
        taskready = function() {
            if (readyFn()) {
                taskready = function() { return true; };
            }
        };
    });
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
        testName = file.leafName.replace(/(^test[_\-])|(\.js$)/g, '');
        currentWorkingDirectory = file.parent;
    },

    get version() {
        return _version;
    },

    viewport: function(w, h) {
        //page.viewportSize({width: w, height: h});
    },

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
        test: 'r',
        testName: 'rw',
        turn_off_animations: 'r',
        version: 'r',
        viewport: 'r',
        waitFor: 'r'
    }
};
