/*jshint esnext:true */

var EXPORTED_SYMBOLS = ["Utils"];

Components.utils.import("resource://gre/modules/Services.jsm");


const isWin = (Services.dirsvc.get("CurWorkD", Components.interfaces.nsIFile)
            instanceof Components.interfaces.nsILocalFileWin);


var Utils = {};

// create an nsIFile object containing the given path. If the path
// is a relative path, the nsIFile object will contain the path resolved against
// the given base path.
// @param string path
// @param nsIFile basepath
// @return nsIFile
Utils.getAbsMozFile = function getAbsMozFile(path, basepath) {
    var file = basepath.clone();
    var pathElements = path.split(/[\\\/]/);
    var first = pathElements[0];
    if (pathElements.length == 1) {
        if (first)
            file.append(first);
        return file;
    }

    if ((isWin && first.match(/\:$/)) || (!isWin && first === '')) {
        // this is an absolute path
        file = Components.classes['@mozilla.org/file/local;1']
                  .createInstance(Components.interfaces.nsILocalFile);
        if (isWin) {
            file.initWithPath(path.replace(/\//g, "\\"));
        }
        else
            file.initWithPath(path);
        return file;
    }

    while(pathElements.length) {
        first = pathElements.shift();
        if (first === '.' || first === '') {
            continue;
        }
        if (first == '..') {
            if (file.parent) {
                file = file.parent;
            }
            continue;
        }
        file.append(first);
    }
    return file;
};

// iterate a directory, and recurse into contained directories
// @param nsIFile  file entry
// @param function callback
Utils.recurse = function(iFile, callback) {
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
                Utils.recurse(item, callback);
            }
        } else {
            if (item.isFile()) {
                callback(item, false);
            }
        }
    }
};

// file parentdir
Utils.directory = function(path) {
    if (!path) {
        return '';
    }
    return path.toString()
            .replace(/\\/g, '/') // replace \ by /
            .replace(/\/$/, "")  // remove trailing slash
            .replace(/\/[^\/]*$/, ''); // remove last path component
};

// read a file
// @param iFile file
Utils.readFile = function(file) {

    let fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].
                   createInstance(Components.interfaces.nsIFileInputStream);
    let cstream = Components.classes["@mozilla.org/intl/converter-input-stream;1"].
                  createInstance(Components.interfaces.nsIConverterInputStream);
    fstream.init(file, -1, 0, 0);
    cstream.init(fstream, "UTF-8", 0, 0);
    let data = '';
    let (str = {}) {
        let read = 0;
        do {
            read = cstream.readString(0xffffffff, str); // read as much as we can and put it in str.value
            data += str.value;
        } while (read !== 0);
    }
    cstream.close(); // this closes fstream
    return data;
};

Utils.dumpo = function(obj, indent) {
    if (typeof obj != 'object') {
        dump(""+obj+"\n")
        return
    }
    let i = indent || "";
    dump(i+"{\n");
    for(let p in obj) {
        dump(p+": ");
        dump(obj[p], i+"   ")
        dump(",\n")
    }
    dump(i+"}\n");
};
