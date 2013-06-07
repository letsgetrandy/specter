/* global phantom, casper:true */

if (!phantom.casperLoaded) {
    console.log('This script must be invoked using the casperjs executable');
    phantom.exit(1);
}
//var fs = require('fs');

specter = function() {

    console.log(casper.specter.baseline);
    console.log(casper.specter.tempbase);
    console.log(casper.specter.diffbase);
    console.log(casper.specter.failbase);

    console.log('rebase: ' + casper.specter.rebase);
    console.log('specterlib: ' + casper.specter.lib);
    phantom.exit();

    var tmp = ['', 'tmp', 'specter'].join(fs.separator);
    var baseline = 'screenshots',
        diffbase = [tmp, 'diff'].join(fs.separator),
        failbase = [tmp, 'fail'].join(fs.separator);

    var diffwindow = require('casper').create();

    console.log(casper.cli.args);

    //casper.on('run.start', function() {
    //    //diffwindow.start("http://localhost:8003/cdn/styles/tests/blank.html");
    //});
    //casper.on('run.complete', function() {
    //    casper.on('exit', function() {
    //        diffwindow.exit();
    //    });
    //});


    var basedir = fs.absolute('.');
    console.log('basedir: ' + basedir);

    function initDiffWindow(){

        diffwindow.page.injectJs('resemble.js');
        diffwindow.evaluate(function(){
            var result;
            var div = document.createElement('div');

            // this is a bit of hack, need to get images into browser for analysis
            div.style = "display:block;position:absolute;border:0;top:-1px;left:-1px;height:1px;width:1px;overflow:hidden;";
            div.innerHTML = '<form id="image-diff">'+
                '<input type="file" id="image-diff-one" name="one"/>'+
                '<input type="file" id="image-diff-two" name="two"/>'+
            '</form><div id="image-diff"></div>';
            document.body.appendChild(div);

            window._imagediff_ = {
                hasResult: false,
                hasImage: false,
                run: run,
                getResult: function(){
                    window._imagediff_.hasResult = false;
                    return result;
                }
            };
            function run(label){
                function render(data){
                    document.getElementById('image-diff').innerHTML = '<img src="'+data.getImageDataUrl(label)+'"/>';
                    window._imagediff_.hasImage = true;
                }
                resemble(document.getElementById('image-diff-one').files[0]).
                    compareTo(document.getElementById('image-diff-two').files[0]).
                    ignoreAntialiasing(). // <-- muy importante
                    onComplete(function(data){
                        var diffImage;

                        if(Number(data.misMatchPercentage) > 0.05){
                            result = data.misMatchPercentage;
                        } else {
                            result = false;
                        }

                        window._imagediff_.hasResult = true;

                        if(Number(data.misMatchPercentage) > 0.05){
                            render(data);
                        }
                    });
            }
        });
    }


    function compare(one, two, func) {

        diffwindow.start("http://localhost:8003/cdn/styles/tests/blank.html", function() {
            initDiffWindow();
        })
        .then(function() {
            //if(!diffwindow.evaluate(function(){ return window._imagediff_;})){
            //    initDiffWindow();
            //}
            this.fill('form#image-diff', {
                'one': one,
                'two': two
            });
            this.evaluate(function(filename){
                window._imagediff_.run(filename);
            }, {
                label: one
            });
            this.waitFor(
                function check() {
                    return this.evaluate(function(){
                        return window._imagediff_.hasResult;
                    });
                },
                function () {
                    var mismatch = diffwindow.evaluate(function(){
                        return window._imagediff_.getResult();
                    });
                    if(Number(mismatch)){
                        func(false, mismatch);
                    } else {
                        func(true);
                    }
                }, function(){
                    func(false);
                },
                10000
            );
        })
        .run(function(){
            //
        });
        func(false, null);
        return;
    }

    function generate_failed_image () {
        casper.waitFor(
            function check() {
                return diffwindow.evaluate(function(){
                    return window._imagediff_.hasImage;
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

                diffwindow.evaluate(function(){
                    window._imagediff_.hasImage = false;
                });

                diffwindow.captureSelector(failFile, 'img');
            }, function(){},
            10000
        );
    }
    /*
    casper.test.assertScreenshot = function (selector, filename, description) {
        var completed = false;
        var fn = this.currentTestFile;
        var i = this.currentTestFile.indexOf(basedir + '/');
        if (i === 0) {
            fn = this.currentTestFile.substring(basedir.length + 1);
        }
        var dir = fn.split(fs.separator),
            testfile = dir.pop().replace(/\.js$/, '').replace(/^test-/, ''),
            parent = dir.join(fs.separator),
            path = [
                    dir.join(fs.separator),
                    testfile + '-' + filename + '.png'
                ].join(fs.separator),
            result = false;
        //var fn = this.currentTestFile.replace(basedir, '');
        //console.log(fn);
        console.log(baseline + fs.separator + path);

        //casper.wait(5000, function() {
            if (fs.exists(baseline + fs.separator + path)) {
                // do diff
                casper.captureSelector(diffbase + fs.separator + path, selector);
                //var completed = false;
                //compare(
                //    diffbase + fs.separator + path,
                //    baseline + fs.separator + path,
                //    function (same, mismatch) {
                //        completed = true;
                //        result = same;
                //        console.log(same);
                //        console.log(mismatch);
                //    }
                //);
                result = true;
            } else {
                // capture baseline
                casper.captureSelector(baseline + fs.separator + path, selector);
            }
                casper.waitFor(function() {
                    return completed;
                }, function() {
                    this.test.assert(result, description, {
                        type: "assertScreenshot",
                        standard: description,
                        values: {
                            subject: selector,
                            filename: filename,
                            description: description
                        }
                    });
                });
        //});
    };
    */

    return {

        tmp: function () {
            if (arguments.length) {
                tmp = arguments[0];
            }
            return tmp;
        },

        baseline: function () {
            if (arguments.length) {
                baseline = arguments[0];
            }
            return baseline;
        },

        turn_off_animations: function() {
            window.addEventListener('load', function(){
                var css = document.createElement("style");
                css.type = "text/css";
                css.innerHTML = "* { -webkit-transition: none !important; transition: none !important; }";
                document.body.appendChild(css);

                if(jQuery){
                    $.fx.off = true;
                }
            },false);
        },

        screenshot: function(selector, filename, waittime) {
            var fn = casper.test.currentTestFile;
            var i = fn.indexOf(basedir + '/');
            if (i === 0) {
                fn = fn.substring(basedir.length + 1);
            }
            var dir = fn.split(fs.separator),
                testfile = dir.pop().replace(/\.js$/, '').replace(/^test-/, ''),
                parent = dir.join(fs.separator),
                path = [
                        dir.join(fs.separator),
                        testfile + '-' + filename + '.png'
                    ].join(fs.separator);


            console.log(baseline + fs.separator + path);

            //console.log('screenshotting (' + waittime + ')');
            casper.captureBase64('png'); // force pre-render
            casper.wait(waittime || 250, function() {
                try{
                    //casper.captureSelector(_fileNameGetter(_root, fileName), selector);
                    if (fs.exists(baseline + fs.separator + path)) {
                        casper.captureSelector(diffbase + fs.separator + path, selector);
                    } else {
                        casper.captureSelector(baseline + fs.separator + path, selector);
                    }
                }
                catch(ex){
                    console.log("Screenshot FAILED: " + ex.message);
                    return false;
                }
            });
        }
    };
}();

//var css = require('./static/styles/tests/specter.js');
//var testroot = './static/styles/tests';
//var testdir = '';
//var tmp = '/tmp/specter';

//css.init({
//    libraryRoot: testroot,
//    baselineRoot: './static/styles/screenshots',
//    tempDir: tmp,
//    testRunnerUrl: 'http://localhost:8003/cdn/styles/tests/blank.html'
//});


casper.test.done();
