/* global phantom, console, casper:true */

if (!phantom.casperLoaded) {
    console.log('This script must be invoked using the casperjs executable');
    phantom.exit(1);
}

specter = function() {

    /*
    casper.test.assertScreenshot = function (selector, filename, description) {
        var completed = false;
        var fn = this.currentTestFile;
        var i = this.currentTestFile.indexOf(casper.specter.baseline + '/');
        if (i === 0) {
            fn = this.currentTestFile.substring(casper.specter.baseline.length + 1);
        }
        var dir = fn.split(fs.separator),
            testfile = dir.pop().replace(/\.js$/, '').replace(/^test-/, ''),
            parent = dir.join(fs.separator),
            path = [
                    dir.join(fs.separator),
                    testfile + '-' + filename + '.png'
                ].join(fs.separator),
            result = false;
        //var fn = this.currentTestFile.replace(casper.specter.baseline, '');
        //console.log(fn);
        console.log(baseline + fs.separator + path);

        //casper.wait(5000, function() {
            if (fs.exists(baseline + fs.separator + path)) {
                // do diff
                casper.captureSelector(casper.specter.diffbase + fs.separator + path, selector);
                //var completed = false;
                //compare(
                //    casper.specter.diffbase + fs.separator + path,
                //    casper.specter.baseline + fs.separator + path,
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
            if (fn.indexOf(fs.workingDirectory + '/') === 0) {
                fn = fn.substring(fs.workingDirectory.length + 1);
            }
            var dir = fn.split(fs.separator),
                testfile = dir.pop().replace(/\.js$/, '').replace(/^test-/, ''),
                path = [
                        dir.join(fs.separator),
                        testfile + '-' + filename + '.png'
                    ].join(fs.separator);

            casper.captureBase64('png'); // force pre-render
            casper.wait(waittime || 250, function() {
                try{
                    if (casper.specter.rebase || !fs.exists(casper.specter.baseline + fs.separator + path)) {
                        casper.echo('capturing baseline: ' + path, 'INFO', 80);
                        casper.captureSelector(
                            casper.specter.baseline + fs.separator + path,
                            selector
                        );
                    } else {
                        casper.captureSelector(
                            casper.specter.diffbase + fs.separator + path,
                            selector
                        );
                    }
                }
                catch(ex){
                    casper.echo("Screenshot failed: " + ex.message, 'ERROR');
                    return false;
                }
            });
        }
    };
}();

casper.test.done();
