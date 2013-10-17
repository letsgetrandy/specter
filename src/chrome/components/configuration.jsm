
/* Component specific code.                                               */

const CLASS_ID = Components.ID('{86939149-65a1-4777-8133-b97506250963}');
const CLASS_NAME = 'My XPCOM Component';
const CONTRACT_ID = '@specter/configuration;1';
const SOURCE = 'chrome://specter/content/xpcom.js';
const INTERFACE = Components.interfaces.nsIMyComponent;


//Components.utils.import("resource://specter/

//var envService = Components.classes["@mozilla.org/process/environment;1"]
//                .getService(Components.interfaces.nsIEnvironment);

//var httphandler =

/*

function specter_configuration() {}

specter_configuration.prototype = {

    classID: Components.ID("{}"),
    classDescription: "Specter configuration",
    QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsICommandLineHandler]),

};

var NSGetFactory = XPCOMUtils.generateNSGetFactory([specter_configuration]);
*/


/* ---------------------------------------------------------------------- */
/* Template.  No need to modify the code below.                           */

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const loader = Cc['@mozilla.org/moz/jssubscript-loader;1']
    .getService(Ci.mozIJSSubScriptLoader);

function Component() {
    this.wrappedJSObject = this;
}

Component.prototype = {
    reload: function() {
        loader.loadSubScript(SOURCE, this.__proto__);
    },

    QueryInterface: function(aIID) {
        if(!aIID.equals(INTERFACE) &&
           !aIID.equals(Ci.nsISupports))
            throw Cr.NS_ERROR_NO_INTERFACE;
        return this;
    }
};
loader.loadSubScript(SOURCE, Component.prototype);

var Factory = {
    createInstance: function(aOuter, aIID) {
        if(aOuter != null)
            throw Cr.NS_ERROR_NO_AGGREGATION;
        var component = new Component();
        if(typeof(component.init) == 'function')
            component.init();

        return component.QueryInterface(aIID);
    }
};

var Module = {
    _firstTime: true,

    registerSelf: function(aCompMgr, aFileSpec, aLocation, aType) {
        if (this._firstTime) {
            this._firstTime = false;
            throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;
        };
        aCompMgr = aCompMgr.QueryInterface(Ci.nsIComponentRegistrar);
        aCompMgr.registerFactoryLocation(
            CLASS_ID, CLASS_NAME, CONTRACT_ID, aFileSpec, aLocation, aType);
    },

    unregisterSelf: function(aCompMgr, aLocation, aType) {
        aCompMgr = aCompMgr.QueryInterface(Ci.nsIComponentRegistrar);
        aCompMgr.unregisterFactoryLocation(CLASS_ID, aLocation);
    },

    getClassObject: function(aCompMgr, aCID, aIID) {
        if (!aIID.equals(Ci.nsIFactory))
            throw Cr.NS_ERROR_NOT_IMPLEMENTED;

        if (aCID.equals(CLASS_ID))
            return Factory;

        throw Cr.NS_ERROR_NO_INTERFACE;
    },

    canUnload: function(aCompMgr) { return true; }
};

function NSGetModule(aCompMgr, aFileSpec) { return Module; }
