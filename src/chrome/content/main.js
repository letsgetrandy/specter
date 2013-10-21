/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://specter/specter.jsm");
Components.utils.import("resource://specter/testrunner.jsm");
Components.utils.import("resource://specter/configuration.jsm");

// we need to output to the shell console
Services.prefs.setBoolPref('browser.dom.window.dump.enabled', true);

function startup() {

    var runtimeIframe = document.getElementById('runtime');
    try {

        configuration.init();
        if (configuration.debug) {
            dump('baseline = ' + configuration.baseline.path + '\n');
            dump('testroot = ' + configuration.testroot.path + '\n');
            dump('diffdir = ' + configuration.diffdir.path + '\n');
        }
        if (configuration.notests) {
            specter.exit(0);
        }

        var argv = specter.config.args,
            argc = argv.length;

        for (let i=0; i<argc; i++) {
            try {
                TestRunner.handleArg(argv[i]);
            } catch(ex) {
                specter.log(ex);
            }
        }
        TestRunner.run();
    }
    catch(ex) {
        specter.log(ex);
        //dumpStack(ex.stack);
        //Services.startup.quit(Components.interfaces.nsIAppStartup.eForceQuit);
    }
}

function doFileRun() {
    //
}

function doFileExit() {
    //Services.startup.quit(Components.interfaces.nsIAppStartup.eForceQuit);
    specter.exit(-1);
}
