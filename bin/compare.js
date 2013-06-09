/*global phantom, CasperError, patchRequire, console, require:true, casper:true*/

if (!phantom.casperLoaded) {
    console.log('This script must be invoked using the casperjs executable');
    phantom.exit(1);
}
var casper = require('casper').create({
    exitOnError: false
});


var fs = require('fs');

//var specterpath = casper.cli.get('specter-path');
var _root = casper.cli.get('baseline');
var _diffRoot = casper.cli.get('diffdir');
var _failRoot = casper.cli.get('faildir');

var _verbose = false;
var _count = 0;
var _diffpage = 'http://localhost:5055/blank.html';
var exitStatus;
var _testdir;
var _prefix;


// write to STDOUT without a newline
function out (s) {
    fs.write('/dev/stdout', s, 'w');
}


// helper to recursively inspect a directory
function recurse (path, checkpath) {
    fs.list(path).forEach(function(filename) {
        if (filename == '.' || filename == '..') {
            return;
        }
        var f = [path, filename].join(fs.separator);
        if (fs.isDirectory(f)) {
            if (checkpath(f, true)) {
                recurse(f, checkpath);
            }
        } else {
            if (fs.isFile(f)) {
                checkpath(f, false);
            }
        }
    });
}

function getDiffs(dir, matches, mask) {
    var regex = new RegExp("^" + fs.absolute(_root).replace('.', '\\.').replace('/', '\\/'));
    function comparator (path, isDir) {
        if (isDir) {
            return true;
        } else {
            var abspath = fs.absolute(path);
            if (fs.isFile(abspath.replace(regex, _diffRoot))) {
                var filename = abspath.split(fs.separator).pop();
                if (!mask || filename.indexOf(mask) === 0) {
                    matches.push(path.substring(_root.length+1));
                }
            }
        }
    }
    recurse(dir, comparator);
    return matches;
}

function asyncCompare(one, two, func) {

    if(!casper.evaluate(function(){ return window.diffing;})){
        console.log('resemble.js error');
        phantom.exit(1);
    }
    casper.fill('#diff_form', {
        "a": one,
        "b": two
    });
    casper.evaluate(function(){
        window.diffing.run();
    });
    casper.waitFor(
        function check() {
            return this.evaluate(function(){
                return window.diffing.done;
            });
        },
        function () {
            var mismatch = casper.evaluate(function(){
                return window.diffing.getResult();
            });

            if(Number(mismatch)){
                func(false, mismatch);
            } else {
                func(true);
            }

        }, function(){
            func(false);
        },
        5000
    );
}


function compareAll(){
    var tests = [];
    var fails = 0;
    var errors = 0;
    var queue = [];

    casper.cli.args.forEach(function(path) {
        var p = _root + fs.separator + path;
        if (fs.isDirectory(path)) {
            queue = getDiffs(p, queue);
        }
        if (fs.isFile(path)) {
            console.log('is file');
            var arr = p.split(fs.separator),
                mask = arr.pop().replace(/(^test-)|(\.js$)/g, ''),
                dir = arr.join(fs.separator);
            queue = getDiffs(dir, queue, mask);
        }
    });
    queue.forEach(function(file){
        var baseFile = _root + "/" + file;
        var diffFile = _diffRoot + "/" + file;
        var test = {
            filename: file
        };

        if(!fs.isFile(baseFile)) {
            test.error = true;
            errors++;
            tests.push(test);
        } else {
            casper.
            thenOpen (_diffpage, function (){
                asyncCompare(baseFile, diffFile, function(isSame, mismatch){

                    if(!isSame){
                        test.fail = true;
                        fails++;

                        if(mismatch){
                            test.mismatch = mismatch;
                            _onFail(test);
                        } else {
                            _onTimeout(test);
                        }

                        casper.waitFor(
                            function check() {
                                return casper.evaluate(function(){
                                    return window.diffing.hasImage;
                                });
                            },
                            function () {

                                var failFile = _failRoot + "/" + file;
                                var safeFileName = failFile;
                                var increment = 0;

                                while (fs.isFile(safeFileName) ){
                                    increment++;
                                    safeFileName = failFile + '.' + increment;
                                }
                                failFile = safeFileName;

                                casper.evaluate(function(){
                                    window.diffing.hasImage = false;
                                });

                                casper.captureSelector(failFile, 'img');
                            }, function(){},
                            5000
                        );
                    } else {
                        _onPass(test);
                    }

                    tests.push(test);
                });
            });
        }
    });

    casper.then(function(){
        casper.waitFor(function(){
            return queue.length === tests.length;
        }, function(){
            _onComplete(tests, fails, errors);
        }, function(){},
        5000);
    });
}

function _onPass(test){
    out(".");
}
function _onFail(test){
    if (_verbose) {
        // original output text
        casper.echo('FAILED: ' + test.filename, 'WARNING', 80);
    } else {
        // console-friendly, non-verbose reporting
        out("F");
    }
}
function _onTimeout(test){
    if (_verbose) {
        // original output text
        casper.echo('TIMEOUT: ' + test.filename, 'WARNING', 80);
    } else {
        // console-friendly, non-verbose reporting
        out("E");
    }
}
function _onComplete(tests, noOfFails, noOfErrors){

    if (_verbose) {
        // the original output text
        if( tests.length === 0){
            console.log("\nMust be your first time?");
            console.log("Some screenshots have been generated in the directory " + _root);
            console.log("This is your 'baseline', check the images manually. If they're wrong, delete the images.");
            console.log("The next time you run these tests, new screenshots will be taken.  These screenshots will be compared to the original.");
            console.log('If they are different, PhantomCSS will report a failure.');
        } else {

            console.log("\nPhantomCSS found: " + tests.length + " tests.");

            if(noOfFails === 0){
                console.log("None of them failed. Which is good right?");
                console.log("If you want to make them fail, go change some CSS - weirdo.");
            } else {
                console.log(noOfFails + ' of them failed.');
                console.log('PhantomCSS has created some images that try to show the difference (in the directory ' + _failRoot + '). Fuchsia colored pixels indicate a difference betwen the new and old screenshots.');
            }

            if(noOfErrors !== 0){
                console.log("There were " + noOfErrors + "errors.  Is it possible that a baseline image was deleted but not the diff?");
            }

            exitStatus = noOfErrors+noOfFails;
        }
    } else {
        // non-verbose, console-friendly test results
        console.log('');
        if (noOfFails > 0) {
            var e = noOfErrors + ' error' + (noOfErrors == 1 ? ' ' : 's.');
            var f = noOfFails + ' failure' + (noOfFails == 1 ? ' ' : 's.');
            casper.echo(f + " " + e, 'COMMENT', 80);
            tests.forEach(function(test){
                if(test.fail){
                    casper.echo("FAILURE: " + test.filename, 'ERROR', 80);
                }
            });
        } else {
            casper.echo('SUCCESS.', 'GREEN_BAR', 80);
        }
    }
}

casper.start(_diffpage, function() {
    fs.removeTree(_failRoot);
})
.then(function() {
    compareAll();
})
.run(function() {
    phantom.exit(exitStatus);
});
