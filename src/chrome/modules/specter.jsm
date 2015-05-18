/*global Components:false, Services:false, File:false, TestResults:true, configuration:false */
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
    let v = parseInt(val);
    if (isNaN(v)) {
        return 0;
    }
    return v;
}


var parentwin = windowMediator.getMostRecentWindow("specter");
var window, browser, loaded=false, pagedone=true;
var queue=[], testFile, testName, pagesize;
var fnOnload, fnOnunload;

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
        if (el.offsetWidth <= 0 || el.offsetHeight <= 0) {
            log_error("NotVisibleError: Unable to capture '" + selector + "'");
            TestResults.error(filename);
            return;
        }
        clip = el.getBoundingClientRect();
    } else {
        log_error("NotFoundError: Unable to capture '" + selector + "'");
        TestResults.error(filename);
        return;
    }

    if (!configuration.testroot.contains(testFile, false)) {
        log('\nConfigError: Test files are not within "testroot".');
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

    // if rebasing, delete old baseline
    if (configuration.rebase) {
        if (baseline.exists()) {
            baseline.remove(false);
        }
    }

    if (baseline.exists()) {
        // capture and compare
        let content = imagelib.capture(window, clip, null);
        let blob = File(baseline);
        let basedata = imagelib.createImage(blob);
        let diff = imagelib.compare(content, basedata);
        if (diff) {
            let diffFile = configuration.diffdir.clone();
            for (let i=0; i<_dirs.length; i++) {
                diffFile.append(_dirs[i]);
            }
            diffFile.append(capture_name + '-diff.png');
            imagelib.saveCanvas(diff, diffFile);
            _dirs.unshift(configuration.diffdir.path);
            _dirs.push(capture_name + '-diff.png');
            TestResults.fail(_dirs.join('/'));
        } else {
            TestResults.pass(capture_name);
        }
    } else {
        // capture and save
        imagelib.capture(window, clip, baseline);
        TestResults.rebase(capture_name);
    }
    return;
}

function click(selector) {
    queue.push(function clickSelector() {
        var w = browser.contentWindow.wrappedJSObject,
            el = w.document.querySelector(selector);
        if (el) {
            el.click();
        } else {
            log_error("ClickError: element not found '" + selector + "'");
        }
    });
}

function exit(code) {
    dump("\n");
    let c = code || 0;
    data = 'exit ' + c;

    try {
        if (configuration.outfile) {
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

            // if a failviewer is defined run it for failed diffs
            if (TestResults.failCount > 0 && configuration.failviewer) {
                cstream.writeString(configuration.failviewer + ' ' +
                        TestResults.failedTests.join(' ') + '\n');
            }

            cstream.writeString(data);
            cstream.close();
            fstream.close();
        }
    } catch(ex) {
    //    log(ex);
    } finally {
        Services.startup.quit(Components.interfaces.nsIAppStartup.eForceQuit);
    }
}

function hide(selector) {
    queue.push(function hideSelector(){
        var w = browser.contentWindow.wrappedJSObject,
            el = w.document.querySelector(selector);
        el.style.display = 'none';
    });
}

function log(s) {
    dump(s + "\n");
}

function log_error(s) {
    dump("\n" + s + " in " + testFile.path + "\n\n");
}

function onLoad(callback) {
    fnOnload = callback;
}

function onUnload(callback) {
    fnOnunload = callback;
}

function open(uri, callback) {
    loaded = false;
    pagedone = false;

    let features = "chrome,dialog=no,scrollbars=yes";
        features += ",width=1000,height=500";

    window = parentwin.openDialog(
            'chrome://specter/content/webpage.xul',
            '_blank', features, { callback:function(b){

        browser = b;
        addLoadListener(callback);

        try {
            var url = getURL(uri);
            if (configuration.debug) {
                log('opening ' + url);
            }
            browser.loadURI(url, null, null);
            //browser.webNavigation.loadURI(uri,
            //    0, null, null, null);
        } catch(ex) {
            log(ex);
            loaded = true;
            pagedone = true;
        }
    }});
}

function waitForLoad() {
    queue.push(function() {
        taskready = function() { return false; };
        addLoadListener(function loadDone() {
            taskready = function() { return true; };
        });
    });
}

function addLoadListener(callback) {
    ProgressListener.setListener(function loadListener(){
        loaded = true;
        ProgressListener.setListener(function(){});
        browser.removeProgressListener(ProgressListener);
        if (fnOnload && typeof fnOnload === 'function') {
            fnOnload();
        }
        callback();
    });
    browser.addProgressListener(ProgressListener,
            Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);
}

function getURL(uri) {
    var match=null, path='';
    // check for relative URL
    if (uri.indexOf('://') < 0) {

        // if hostname specified, override everything
        if (configuration.hostname) {
            return configuration.hostname + uri;
        }

        // determine the relative path to the test file from the base dir
        let _dirs = [], _testfile = testFile.clone();
        while (!_testfile.equals(configuration.testroot)) {
            _dirs.unshift(_testfile.leafName);
            _testfile = _testfile.parent;
        }
        let _path = _dirs.join('/');

        // check for a hostname defined on a path
        for (path in configuration.hostnames) {
            if (_path.indexOf(path) === 0) {
                return configuration.hostnames[path] + uri;
            }
        }

        // otherwise, treat it as a relative file
        let dir = testFile.parent.clone();
        dir.append(uri);
        return 'file://' + dir.path;
    } else {
        return uri;
    }
}

function perform(fn) {
    queue.push(fn.bind(specter));
}

function remove(selector) {
    queue.push(function removeSelector(){
        var w = browser.contentWindow.wrappedJSObject,
            el = w.document.querySelector(selector);
        el.parentNode.removeChild(el);
    });
}

function show(selector) {
    queue.push(function showSelector(){
        var w = browser.contentWindow.wrappedJSObject,
            el = w.document.querySelector(selector);
        el.style.display = '';
    });
}

function taskready() {
    return true;
}

function dequeue() {
    if (taskready()) {
        var fn;
        if (fn = queue.shift()) {
            fn();
        } else {
            timer.cancel();
            if (fnOnunload && typeof fnOnunload === 'function') {
                fnOnunload();
            }
            pagedone = true;
            if (browser) {
                browser = null;
            }
            if (window) {
                window.close();
                window = null;
            }
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
        if (sizes.hasOwnProperty(size) {
            let mysize = String(sizes[size]);

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
}

function wait (delay) {
    queue.push(function(){
        var start = new Date();
        taskready = function() {
            return (new Date() - start) > delay;
        };
    });
}

function waitFor(readyFn) {
    var timeout = 5000,
        start = new Date();
    if (arguments.length > 1 && !isNaN(arguments[1])) {
        timeout = arguments[1];
    }
    queue.push(function(){
        taskready = function() {
            var now = new Date();
            if (now - start > timeout) {
                while (queue.length) {
                    queue.shift();
                }
                taskready = function() { return true; };
                TestResults.error(testFile.path);
            } else {
                if (readyFn()) {
                    taskready = function() { return true; };
                }
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

    click: click,

    get config() {
        return configuration;
    },

    exit: exit,
    hide: hide,
    log: log,
    onLoad: onLoad,
    onUnload: onUnload,
    open: open,
    perform: perform,

    get ready() {
        return pagedone;
    },

    remove: remove,
    runTests: runTests,
    show: show,
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
    waitForLoad: waitForLoad,

    get window() {
        try {
            return browser.contentWindow.wrappedJSObject;
        } catch (ex) {
            return null;
        }
    },

    __exposedProps__ : {
        capture: 'r',
        click: 'r',
        config: 'r',
        debug: 'r',
        exit: 'r',
        hide: 'r',
        log: 'r',
        onLoad: 'r',
        onUnload: 'r',
        open: 'r',
        ready: 'r',
        remove: 'r',
        runTests: 'r',
        setTestFile: 'r',
        show: 'r',
        test: 'r',
        testName: 'rw',
        turn_off_animations: 'r',
        version: 'r',
        viewport: 'r',
        wait: 'r',
        waitFor: 'r',
        waitForLoad: 'r'
    }
};
