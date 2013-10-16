/*jshint esnext:true */

const CLASS_ID = '{3691989c-31fb-11e3-8315-4c8d79f156f4}';
const CLASS_NAME = 'Specter command-line handler';
//const CONTRACT_ID = '@specter/commandline;1';
//const SOURCE = 'chrome://specter/content/xpcom.js';


Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://specter/utils.jsm");
Components.utils.import("resource://specter/configuration.jsm");


var environment = Components.classes["@mozilla.org/process/environment;1"]
                .getService(Components.interfaces.nsIEnvironment);
//var httphandler = Components.classes["@mozilla.org/network/protocol;1?name=http"]
//                .getService(Components.interfaces.nsIHttpProtocolHandler);


function CommandLine() {}

CommandLine.prototype = {

    classID: Components.ID(CLASS_ID),
    classDescription: CLASS_NAME,
    QueryInterface: XPCOMUtils.generateQI(
            [Components.interfaces.nsICommandLineHandler]),

    handle: function(cmdLine) {

        // clear all caches, so scripts will be truly loaded
        var cacheServiceId = "@mozilla.org/network/cache-service;1",
            cacheService = Components.classes[cacheServiceId]
                           .getService(Components.interfaces.nsICacheService);
        try {
            cacheService.evictEntries(
                    Components.interfaces.nsICache.STORE_ANYWHERE);
        } catch (ex) {
            dump("error cache service: " + ex + "\n");
        }

        configuration.workingDirectory = cmdLine.workingDirectory;

        /*
        // TODO: is this necessary?
        if (environment.exists('SPECTER_ENV')) {
            let envs = environment.get('SPECTER_ENV');
            configuration.setEnvNames(envs.split(/,/));
        }

        try {
            configuration.handleFlags(cmdLine);
        } catch (ex) {
            dump(ex + "\n");
            cmdLine.preventDefault = true;
            return;
        }
        */

        // TODO: this is superfluous
        //
        if (cmdLine.length === 0) {
            Components.utils.reportError("script is missing");
            dump("script is missing\n");
            cmdLine.preventDefault = true;
            return;
        }


        let argc = cmdLine.length,
            argv = [];

        let realArgs = '';
        if (environment.exists('SPECTER_ARGS')) {
            realArgs = environment.get('SPECTER_ARGS');
        }

        for (let i=0; i<argc; i++) {
            let arg = cmdLine.getArgument(i);
            if (arg.charAt(0) == '-' && realArgs) {
                let r = new RegExp("-" + arg + "(\=[^\s]+)?");
                let result = r.exec(realArgs);
                if (result) {
                    if (result[1]) {
                        i++;
                        configuration.opts.push('-' + arg + '=' +
                                cmdLine.getArgument(i));
                        //configuration.opts.push('-' + arg
                    } else {
                        configuration.opts.push('-' + arg);
                    }
                } else {
                    configuration.args.push(arg);
                }
            } else {
                configuration.args.push(arg);
            }
        }
        cmdLine.removeArguments(0, argc - 1);


        /*
         * TODO: superfluous
        if (configuration.args[0].substr(0, 1) == '-') {
            Components.utils.reportError("unknown option " +
                    configuration.args[0]);
            dump("unknown option " + configuration.args[0] + " \n");
            cmdLine.preventDefault = true;
            return;
        }
        */

        /*
         * TODO: should loop in the processing function, not here
         *
        for (let i=0; i<configuration.args.length; i++) {
            //dump(i + ': ' + configuration.args[i] + '\n');
            var testfile = '';

            try {
                if (/Mac/i.test(httphandler.oscpu)) {
                    // under MacOS, resolveFile failes with a relative path
                    try {
                        testfile = cmdLine.resolveFile(configuration.args[0]);
                    } catch(ex) {
                        testfile = Utils.getAbsMozFile(
                              configuration.args[i], cmdLine.workingDirectory);
                    }
                } else {
                    testfile = cmdLine.resolveFile(configuration.args[0]);
                }
                if (testfile.exists()) {
                    argv.push(testfile);
                } else {
                    throw "file not found: " + configuration.args[i];
                }
            } catch(ex) {
                Components.utils.reportError("file not found: '" +
                        configuration.args[i] + "'");
                dump("file not found: " + configuration.args[i] + "\n");
                //cmdLine.preventDefault = true;
                //return;
            }
        }
        configuration.args = argv;
        */

        /*
        Components.utils.import("resource://specter/debug.jsm");
        if (DEBUG_CLI) {
            DebugLog('script args: ' + configuration.args.join(' '));
        }
        if (DEBUG_CONFIG) {
            configuration.printDebugConfig();
        }
        */
    },

    get helpInfo() {
        return "\n";
    }
};

var NSGetFactory = XPCOMUtils.generateNSGetFactory([CommandLine]);
