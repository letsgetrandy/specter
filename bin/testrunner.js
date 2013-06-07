/*global phantom, CasperError, patchRequire, console, require:true, casper:true*/

if (!phantom.casperLoaded) {
    console.log('This script must be invoked using the casperjs executable');
    phantom.exit(1);
}

var fs           = require('fs');
var utils        = require('utils');
var f            = utils.format;
var tests        = [];
var casper       = require('casper').create({
    exitOnError: false
});

var tmp = ['', 'tmp', 'specter'].join(fs.separator);
casper.specter = {
    lib: '.',
    rebase: false,
    baseline: '',
    tempbase: tmp,
    diffbase: [tmp, 'diff'].join(fs.separator),
    failbase: [tmp, 'fail'].join(fs.separator)
};

/*
// local utils
function checkSelfTest(tests) {
    "use strict";
    var isCasperTest = false;
    tests.forEach(function(test) {
        var testDir = fs.absolute(fs.dirname(test));
        if (fs.isDirectory(testDir) && fs.exists(fs.pathJoin(testDir, '.casper'))) {
            isCasperTest = true;
        }
    });
    return isCasperTest;
}
*/

function checkArgs() {
    "use strict";
    // parse some options from cli
    casper.test.options.concise = true;
    casper.test.options.failFast = casper.cli.get('fail-fast') || false;

    if (casper.cli.get('rebase') === true) {
        casper.specter.rebase = true;
    }
    if (casper.cli.get('specter-path')) {
        casper.specter.lib = casper.cli.get('specter-path');
    }

    // test paths are passed as args
    if (casper.cli.args.length) {
        tests = casper.cli.args.filter(function(path) {
            if (fs.isFile(path) || fs.isDirectory(path)) {
                return true;
            }
            throw new CasperError(f("Invalid test path: %s", path));
        });
    } else {
        casper.echo('No test path passed, exiting.', 'RED_BAR', 80);
        casper.exit(1);
    }
}

function initRunner() {
    "use strict";
    // includes handling
    var specterlib = [casper.specter.lib, 'bin', 'specter.js'].join(fs.separator);
    casper.test.loadIncludes.pre = [specterlib];

    // test suites completion listener
    casper.test.on('tests.complete', function() {
        this.renderResults(true, undefined, casper.cli.get('xunit') || undefined);
        if (this.options.failFast && this.testResults.failures.length > 0) {
            casper.warn('Test suite failed fast, all tests may not have been executed.');
        }
    });
}

var error;
try {
    checkArgs();
} catch (e) {
    error = true;
    casper.warn(e);
    casper.exit(1);
}
if (!error) {
    initRunner();
    casper.test.runSuites.apply(casper.test, tests);
}
