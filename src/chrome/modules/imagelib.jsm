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

const tolerance = 16;

// save the given data to the specified file
// @param Canvas canvas
// @param string path
function saveCanvas(canvas, file) {

    if (!file.exists()) {
        file.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE,
            parseInt('0666', 8));
    }
    var data = null;
    canvas.toBlob(function(blob) {
        let reader = new parentwin.FileReader();
        reader.onloadend = function() {
            data = reader.result;
        };
        reader.readAsBinaryString(blob);
    });

    var thread = Services.tm.currentThread;
    while (data === null) {
        thread.processNextEvent(true);
    }

    var localfile = Components.classes["@mozilla.org/file/local;1"]
                .createInstance(Components.interfaces.nsILocalFile);
    var stream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                .createInstance(Components.interfaces.nsIFileOutputStream);
    localfile.initWithPath(file.path);

    try {
        stream.init(file, PR_WRONLY | PR_TRUNCATE, parseInt('0666', 8), 0);
        stream.write(data, data.length);
        stream.flush();
    }
    finally {
        stream.close();
    }
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

// create an image from the blob
//
function createImage(blob) {

    var content = null;

    var reader = new parentwin.FileReader();
    reader.addEventListener('loadend', function() {
        content = reader.result;
    });
    reader.readAsDataURL(blob);

    thread = Services.tm.currentThread;
    while (content === null) {
        thread.processNextEvent(true);
    }

    var image = parentwin.document.createElementNS(
                "http://www.w3.org/1999/xhtml", "img");

    var imageLoaded = false;
    image.addEventListener('load', function() {
        imageLoaded = true;
    });
    image.src = content;

    thread = Services.tm.currentThread;
    while (!imageLoaded) {
        thread.processNextEvent(true);
    }

    // create the canvas
    var canvas = parentwin.document.createElementNS(
                "http://www.w3.org/1999/xhtml", "canvas");
    canvas.width = image.width;
    canvas.height = image.height;

    var ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    ctx.restore();

    var content = null;
    canvas.toBlob(function(blob) {
        let reader = new parentwin.FileReader();
        reader.onloadend = function() {
            content = reader.result;
        };
        reader.readAsBinaryString(blob);
    });

    var thread = Services.tm.currentThread;
    while (content === null) {
        thread.processNextEvent(true);
    }

    return canvas;
}

function loop(width, height, callback){
    var x,y;
    for (y=0; y<height; y++){
        for (x=0; x<width; x++){
            callback(x, y);
        }
    }
}

function getPixel(data, offset){
    if(typeof data[offset] !== 'undefined') {
        return {
            r: data[offset],
            g: data[offset + 1],
            b: data[offset + 2]
        };
    } else {
        return null;
    }
}

function isSimilar(d1, d2) {
    var r = Math.abs(d1.r - d2.r) < 16;
    var g = Math.abs(d1.g - d2.g) < 16;
    var b = Math.abs(d1.b - d2.b) < 16;
    return r && g && b;
}

function isAntialiased(sourcePix, data, cacheSet, verticalPos, horizontalPos, width){
    var offset;
    var targetPix;
    var distance = 1;
    var i;
    var j;
    var hasHighContrastSibling = 0;
    var hasSiblingWithDifferentHue = 0;
    var hasEquivilantSibling = 0;

    addHueInfo(sourcePix);

    for (i = distance*-1; i <= distance; i++){
        for (j = distance*-1; j <= distance; j++){

            if(i===0 && j===0){
                // ignore source pixel
            } else {
                offset = ((verticalPos+j)*width + (horizontalPos+i)) * 4;
                targetPix = getPixelInfo(data, offset, cacheSet);

                if(targetPix === null){
                    continue;
                }

                addBrightnessInfo(targetPix);
                addHueInfo(targetPix);

                if(isContrasting(sourcePix, targetPix)) {
                    hasHighContrastSibling++;
                }
                if(isRGBSame(sourcePix,targetPix)) {
                    hasEquivilantSibling++;
                }
                if(Math.abs(targetPix.h - sourcePix.h) > 0.3 ) {
                    hasSiblingWithDifferentHue++;
                }
                if(hasSiblingWithDifferentHue > 1 ||
                        hasHighContrastSibling > 1)
                {
                    return true;
                }
            }
        }
    }

    if(hasEquivilantSibling < 2){
        return true;
    }

    return false;
}

function errPixel(px, offset) {
    px[offset] = 240;
    px[offset + 1] = 20;
    px[offset + 2] = 168;
    px[offset + 3] = 255;
}

function getBrightness(r, g, b){
    return 0.3*r + 0.59*g + 0.11*b;
}

function rgba(data, offset, r, g, b, a) {
    data[offset    ] = r;
    data[offset + 1] = g;
    data[offset + 2] = b;
    data[offset + 3] = a;
}

function isAntialiased() {
    for (var x=-1; x<1; x++) {
        for (var y=-1; y< 1; y++) {
            if (x===0 && y===0) {
                continue;
            }
            //
        }
    }
}

// capture the given selector from the window
// @param window
// @param clip
// @param file
function capture(window, clip, file) {
    // create the canvas
    var canvas = window.document.createElementNS(
                "http://www.w3.org/1999/xhtml", "canvas");
    canvas.top = clip.top;
    canvas.left = clip.left;
    canvas.width = clip.width;
    canvas.height = clip.height;

    var ctx = canvas.getContext("2d");
    ctx.drawWindow(window.content, clip.left, clip.top,
            clip.width, clip.height, "rgba(0,0,0,0)");
    ctx.restore();
    //window.document.documentElement.appendChild(canvas);

    if (file) {
        saveCanvas(canvas, file);
    }
    return ctx.getImageData(0, 0, clip.width, clip.height);
}

// compare captured image-data to a canvas baseline
// @param data
// @param canvas
function compare(data, canvas) {
    var ctx = canvas.getContext("2d");
    var data2 = ctx.getImageData(0, 0, canvas.width, canvas.height);

    var d1 = data.data;
    var d2 = data2.data;

    var diffcanvas = parentwin.document.createElementNS(
                "http://www.w3.org/1999/xhtml", "canvas");
    diffcanvas.width = Math.max(data.width, data2.width);
    diffcanvas.height = Math.max(data.height, data2.height);
    /*
    // widths are the same, determine max height
    if (d1.length > d2.length) {
        diffcanvas.height = (d1.length / 4) / canvas.width;
    } else {
        diffcanvas.height = canvas.height;
    }
    */
    var diffctx = diffcanvas.getContext("2d");
    var data3 = diffctx.getImageData(0, 0,
            diffcanvas.width, diffcanvas.height);
    var d3 = data3.data;

    var pixdiff = 0;
    var pixsame = 0;

    var w=diffcanvas.width, h=diffcanvas.height,
        w1=data.width, h1=data.height,
        w2=data2.width, h2=data2.height;

    loop(w, h, function(x, y) {
        var o1 = (y * w1 + x) * 4,
            o2 = (y * w2 + x) * 4,
            offset = (y * w + x) * 4;

        if (x > w1 || x > w2 || y > h1 || y > h2) {
            pixdiff++;
            rgba(d3, offset, 180, 20, 20, 200);
            return;
        }
        let r = Math.abs(d1[o1  ] - d2[o2  ]) < tolerance;
        let g = Math.abs(d1[o1+1] - d2[o2+1]) < tolerance;
        let b = Math.abs(d1[o1+2] - d2[o2+2]) < tolerance;
        if (r && g && b) {
            pixsame++;
            rgba(d3, offset, 255, 255, 255, 0);
        } else {
//            let b1 = getBrightness(d1[offset], d1[offset+1], d1[offset+2]),
//                b2 = getBrightness(d2[offset], d2[offset+1], d2[offset+2]);
//
//            if (Math.abs(b1 - b2) < (tolerance/2))
//            //        //false
//            //        /*
//            //        isAntialiased(pixel1, data1, 1, verticalPos, horizontalPos, width) ||
//            //    isAntialiased(pixel2, data2, 2, verticalPos, horizontalPos, width) */
//            //    //)
//            {
//                rgba(d3, offset, 255, 255, 255, 0);
//                //
//            } else {
                // unmatched pixel
                rgba(d3, offset, 180, 20, 20, 160);
                //rgba(d3, offset, 255, 255, 0, 255);
                //rgba(d3, offset, 255, 120, 0, 255);
                pixdiff++;
//            }
        }
    });

    if (pixdiff && (pixdiff/(d3.length/4) > 0.005)) {
        diffctx.putImageData(data3, 0, 0);

        var out = parentwin.document.createElementNS(
                "http://www.w3.org/1999/xhtml", "canvas");
        out.width = Math.max(data.width, data2.width);
        out.height = Math.max(data.height, data2.height);
        var outctx = out.getContext("2d");
        outctx.globalAlpha = 0.3;
        outctx.drawImage(canvas, 0, 0);
        outctx.globalAlpha = 1.0;
        outctx.drawImage(diffcanvas, 0, 0);
        outctx.restore();
        return out;
    } else {
        return null;
    }
}

var imagelib = {

    capture:capture,
    compare:compare,
    createImage:createImage,
    loadImage:loadImage,
    saveCanvas:saveCanvas,

    __exposedProps__: {
        capture: 'r',
        compare: 'r',
        createImage: 'r',
        loadImage: 'r',
        saveCanvas: 'r'
    }
};
