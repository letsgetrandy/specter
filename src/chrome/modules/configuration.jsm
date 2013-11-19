/*jshint esnext:true */

var EXPORTED_SYMBOLS = ["configuration"];

const dirsvc =
        Components.classes["@mozilla.org/file/directory_service;1"]
                .getService(Components.interfaces.nsIProperties);

const currentWorkingDirectory =
        dirsvc.get("CurWorkD", Components.interfaces.nsIFile);

const homeDirectory =
        dirsvc.get("Home", Components.interfaces.nsIFile);

const tempDirectory =
        dirsvc.get("TmpD", Components.interfaces.nsIFile);


// configuration

var diffdir = tempDirectory.clone();
var baseline = currentWorkingDirectory.clone();
var testroot = currentWorkingDirectory.clone();


function init() {
    diffdir.append('specter');
    for (var i=0; i< configuration.opts.length; i++) {
        var m = configuration.opts[i].match(/--([^=\s]+)=([^\s]+)/);
        if (m) {
            setopt(m[1], m[2]);
        } else {
            m = configuration.opts[i].match(/--([^=\s]+)/);
            setflag(m[1]);
        }
    }
    findIniFiles();

    // check env

    // check commandline
}

function setopt(k, v) {
    //dump('setting ' + k + ' = "' + v + '"\n');
    switch(k) {
        case 'baseline':
            if (v.charAt(0) !== '/') {
                v = currentWorkingDirectory.path + '/' + v;
            }
            baseline.initWithPath(v);
            break;
        case 'diffdir':
            if (v.charAt(0) !== '/') {
                v = currentWorkingDirectory.path + '/' + v;
            }
            diffdir.initWithPath(v);
            break;
        case 'testroot':
            if (v.charAt(0) !== '/') {
                v = currentWorkingDirectory.path + '/' + v;
            }
            testroot.initWithPath(v);
            break;
    }
}

function setflag(k) {
    switch (k) {
        case 'd':
        case 'debug':
            configuration.debug = true;
            break;
        case 'notests':
            configuration.notests = true;
            break;
        case 'rebase':
            configuration.rebase = true;
            break;
        case 'emptydiffs':
            configuration.emptydiffs = true;
            break;
        case 'v':
        case 'verbose':
            configuration.verbose = true;
            break;
    }
}

function findIniFiles() {
    var dir = currentWorkingDirectory.clone();
    var rcfiles = [];
    while (dir.parent) {
        let file = dir.clone();
        file.append('.specterrc');
        if (file.exists()) {
            rcfiles.push(file.path);
        }
        dir = dir.parent;
    }
    //dump("rc files:\n- " + rcfiles.join("\n- ") + "\n");
    while (rcfiles.length) {
        let path = rcfiles.pop();
        readOpts(path);
    }
}

// parse all setting in .specterrc file, regardless of [section] name
// @param string path
function readOpts(path) {
    var file =
        Components.classes['@mozilla.org/file/local;1']
            .createInstance(Components.interfaces.nsILocalFile);
    file.initWithPath(path);
    var lines = readTextFile(file).split(/\n/);
    //dump(path + ' has ' + lines.length + ' lines.');

    var comment = /^\s*#/,
        setting = /^\s*([^=\s]+)\s*=\s*([^\s]+)/,
        flag    = /^\s*([^=\s]+)/;
    for (let i=0; i<lines.length; i++) {
        if (comment.test(lines[i])) {
            continue;
        }
        var m = lines[i].match(setting);
        if (m) {
            //dump("setting '" + m[1] + "' == '" + m[2] + "'\n");
            setopt(m[1], m[2]);
        } else if (m = lines[i].match(flag)) {
            setflag(m[1]);
        }
    }
}

function readTextFile(file) {
    var charset = 'UTF-8';
    var fs =
        Components.classes['@mozilla.org/network/file-input-stream;1']
            .createInstance(Components.interfaces.nsIFileInputStream);
    //dump('loading file: ' + file.path + '\n');
    fs.init(file, 1, 0, false);
    var converter =
        Components.classes['@mozilla.org/intl/converter-input-stream;1']
            .createInstance(Components.interfaces.nsIConverterInputStream);
    converter.init(fs, charset, fs.available(),
            converter.DEFAULT_REPLACEMENT_CHARACTER);
    var out = {};
    converter.readString(fs.available(), out);
    var contents = out.value;
    converter.close();
    fs.close();
    return contents;
}


var configuration = {

    args: [],
    debug: false,
    emptydiffs: false,
    init: init,
    notests: false,
    opts: [],
    outfile: '',
    rebase: false,
    testFiles: [],
    verbose: false,

    get baseline() {
        return baseline;
    },
    get diffdir() {
        return diffdir;
    },
    get testroot() {
        return testroot;
    },
    get workingDirectory() {
        return currentWorkingDirectory;
    },

    __exposedProps__ : {
        args: 'rw',
        baseline: 'r',
        debug: 'rw',
        diffdir: 'rw',
        emptydiffs: 'rw',
        init: 'r',
        notests: 'rw',
        opts: 'r',
        outfile: 'rw',
        rebase: 'rw',
        testFiles: 'rw',
        testroot: 'r',
        verbose: 'rw',
        workingDirectory: 'r'
    }
};
