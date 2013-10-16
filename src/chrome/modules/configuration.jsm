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
var basedir = currentWorkingDirectory.clone();

                //Components.classes["@mozilla.org/file/local;1"]
                //    .createInstance();


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
    //findIniFiles();

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
    }
}

function setflag(k) {
    switch (k) {
        case 'ignore-errors':
            break;
        case 'rebase':
            configuration.rebase = true;
            break;
    }
}
/*
function findIniFiles() {
    var dir = currentWorkingDirectory.clone();
    var rcfiles = [];
    while (dir.parent) {
        dump("dir: " + dir.path + "\n");
        var file = dir.clone();
        file.append('.specterrc');
        if (file.exists()) {
            rcfiles.push(file.path);
        }
        dir = dir.parent;
    }
    while (rcfiles.length) {
        var f = rcfiles.pop();
        dump("f: " + f + "\n");
        readOpts(file);
    }
    dump(rcfiles.join("\n") + "\n");
}

function readOpts(file) {
    dump("inifile: " + file + "\n");
    var factory = Components.manager.getClassObjectByContractID(
            "@mozilla.org/xpcom/ini-parser-factory;1",
                Components.interfaces.nsIINIParserFactory);
    dump("factory: " + factory + "\n");
    var iniParser = factory.createINIParser(file);
}
/*
function getIniValue(iniFile, section, prop) {
    var factory = Components.manager.getClassObjectByContractID(
            "@mozilla.org/xpcom/ini-parser-factory;1",
                Components.interfaces.nsIINIParserFactory);
    dump("inifile: " + iniFile + "\n");
    var iniParser = factory.createINIParser(iniFile);
    try {
        return iniParser.getString(section.prop);
    } catch(ex) {
        return undefined;
    }
}
*/

var configuration = {

    args: [],
    ignoreSSLErrors: false,
    init: init,
    logFile: 'foo',
    opts: [],
    rebase: false,
    scriptFile: '',
    testFiles: [],
    get basedir() {
        return basedir;
    },
    get baseline() {
        return baseline;
    },
    get diffdir() {
        return diffdir;
    },
    get workingDirectory() {
        return currentWorkingDirectory;
    },

    handleFlags: function(foo) {
        //bar
    },
    setEnvNames: function(foo) {
        //bar
    },

    __exposedProps__ : {
        args: 'rw',
        basedir: 'r',
        baseline: 'r',
        diffdir: 'rw',
        ignoreSSLErrors: 'rw',
        init: 'r',
        logFile: 'rw',
        opts: 'r',
        rebase: 'rw',
        scriptFile: 'rw',
        setEnvNames: 'r',
        testFiles: 'rw',
        workingDirectory: 'r'
    }
};
