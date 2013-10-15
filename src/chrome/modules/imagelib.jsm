/*jshint esnext:true */

var EXPORTED_SYMBOLS = ["imagelib"];

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://specter/Utils.jsm");
Components.utils.import("resource://specter/configuration.jsm");
Components.utils.import("resource://specter/progress_listener.jsm");

const windowMediator =
        Components.classes["@mozilla.org/appshell/window-mediator;1"]
                .getService(Components.interfaces.nsIWindowMediator);

const parentwin =
        windowMediator.getMostRecentWindow("specter");

const PR_RDONLY      = 0x01;
const PR_WRONLY      = 0x02;
const PR_CREATE_FILE = 0x08;
const PR_APPEND      = 0x10;
const PR_TRUNCATE    = 0x20;


var canvas1, canvas2;

function setImage(filedata) {
    var tolerance = {
        red: 16,
        green: 16,
        blue: 16,
        minBrightness: 16,
        maxBrightness: 240
    };
    var ignoreAntialiasing = true;
    var ignoreColors = false;


    canvas1 = window.document.createElementNS(
                "http://www.w3.org/1999/xhtml", "canvas");
    canvas1.width = clip.width;
    canvas1.height = clip.height;

    var ctx = canvas1.getContext("2d");
    ctx.drawImage(window.document.getElementById("asdfasdf"), x, y);

}

function parseImage(sourceImageData, width, height){

    var pixleCount = 0;
    var redTotal = 0;
    var greenTotal = 0;
    var blueTotal = 0;
    var brightnessTotal = 0;

    loop(height, width, function(verticalPos, horizontalPos){
        var offset = (verticalPos*width + horizontalPos) * 4;
        var red = sourceImageData[offset];
        var green = sourceImageData[offset + 1];
        var blue = sourceImageData[offset + 2];
        var brightness = getBrightness(red,green,blue);

        pixleCount++;

        redTotal += red / 255 * 100;
        greenTotal += green / 255 * 100;
        blueTotal += blue / 255 * 100;
        brightnessTotal += brightness / 255 * 100;
    });

    data.red = Math.floor(redTotal / pixleCount);
    data.green = Math.floor(greenTotal / pixleCount);
    data.blue = Math.floor(blueTotal / pixleCount);
    data.brightness = Math.floor(brightnessTotal / pixleCount);

    triggerDataUpdate();
}

// return the contents of the specified file
// @param string path - the path of the file to load
function loadImage(path) {
    var file = Components.classes["@mozilla.org/file/local;1"]
                   .createInstance(Components.interfaces.nsILocalFile);
    var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"]
            .createInstance(Components.interfaces.nsIFileInputStream);
    var sstream = Components.classes["@mozilla.org/scriptableinputstream;1"]
            .createInstance(Components.interfaces.nsIScriptableInputStream);
    file.initWithPath(path);
    if (!file.exists()) {
        return null;
    }
    fstream.init(file, PR_RDONLY, parseInt('0004', 8), null);
    sstream.init(fstream);
    var output = sstream.read(sstream.available());
    sstream.close();
    fstream.close();
    return output;
}

// save the given data to the specified file
// @param blob   data
// @param string path
function saveImage(data, filename) {
    //dump(filename+'\n');
    var file = Components.classes["@mozilla.org/file/local;1"]
                .createInstance(Components.interfaces.nsILocalFile);
    var stream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                .createInstance(Components.interfaces.nsIFileOutputStream);
    file.initWithPath(filename);

    try {
        stream.init(file, PR_WRONLY | PR_TRUNCATE, parseInt('0666', 8), 0);
        stream.write(data, data.length);
        stream.flush();
    }
    finally {
        stream.close();
    }
}

function capture(window, document, selector, filename) {
    var clip;
    //var w = browser.contentWindow.wrappedJSObject;
    //var doc = w.document;
    var el = document.querySelector(selector);
    if (el) {
        clip = el.getBoundingClientRect();
    } else {
        log("NotFoundError: Unable to capture '" + selector + "'.");
        return;
    }

    // create the canvas
    var canvas = window.document.createElementNS(
                "http://www.w3.org/1999/xhtml", "canvas");
    //var canvas = document.createElement("canvas");
    canvas.left = clip.left;
    canvas.width = clip.width;
    canvas.height = clip.height;

    var ctx = canvas.getContext("2d");
    ctx.drawWindow(window.content, clip.left, clip.top,
            clip.width, clip.height, "rgba(0,0,0,0)");
    ctx.restore();
    //window.document.documentElement.appendChild(canvas);

    var content = null;
    canvas.toBlob(function(blob) {
        //let reader = new browser.contentWindow.FileReader();
        let reader = new window.FileReader();
        reader.onloadend = function() {
            content = reader.result;
        };
        reader.readAsBinaryString(blob);
    });

    var thread = Services.tm.currentThread;
    while (content === null) {
        thread.processNextEvent(true);
    }

    /* Invert

    var imageData = ctx.getImageData(clip.left, clip.top, clip.width, clip.height);
    var data = imageData.data;

    for(var i = 0; i < data.length; i += 4) {
        // red
        data[i] = 255 - data[i];
        // green
        data[i + 1] = 255 - data[i + 1];
        // blue
        data[i + 2] = 255 - data[i + 2];
    }

    // overwrite original image
    ctx.putImageData(imageData, 0, 0);
    */

    return content;
}

function compare() {
    var window;
    function callback() {
        dump('.');
        //window.close();
    }
    let features = "chrome,dialog=no,scrollbars=yes";
        features += ",width=1000,height=500";
    window = parentwin.openDialog(
            "chrome://specter/content/webpage.xul",
            "_blank", features, { callback:callback });
}

var imagelib = {
    capture:capture,
    compare:compare,
    loadImage:loadImage,
    saveImage:saveImage
};
