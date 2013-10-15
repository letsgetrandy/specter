var EXPORTED_SYMBOLS = ["ProgressListener"];

const STATE_START =
        Components.interfaces.nsIWebProgressListener.STATE_START;
const STATE_STOP =
        Components.interfaces.nsIWebProgressListener.STATE_STOP;

const timer =
        Components.classes["@mozilla.org/timer;1"]
            .createInstance(Components.interfaces.nsITimer);


function AProgressListener(){}

AProgressListener.prototype = {

    listener: function() {
        // dummy function. will be overwritten!
    },

    setListener: function(fn) {
        this.listener = fn;
    },

    QueryInterface: function(aIID) {
        if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
                aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
                aIID.equals(Components.interfaces.nsISupports))
            return this;
        throw Components.results.NS_NOINTERFACE;
    },

    myClearTimer: function() {
        timer.cancel();
    },

    myRestartTimer: function() {
        var self = this;
        timer.cancel();
        timer.initWithCallback(function(){
            self.myTimerDone();
        }, 500, timer.TYPE_ONE_SHOT);
    },

    myTimerDone: function() {
        //dump("The page is loaded!\n");
        this.listener();
    },

    onStateChange: function(aProgress, aRequest, aFlag, aStatus) {
        // NOTE: Might need to use aProgress.DOMWindow
        if(aFlag & STATE_START) {
            // NOTE: Page has started loading!
            timer.cancel();
        }
        if(aFlag & STATE_STOP) {
            // NOTE: Page has finished loading!
            // WARNING: Some pages (e.g. http://msn.com I think?) might load
            //     several times before all of their content is downloaded.
            //     Therefore, it is safest to add a *timeout*.  Thus, if there
            //     if there are no STATE_START/STATE_STOP events for the last
            //     couple seconds, then it is a safe bet that the page is
            //     really done loading.
            this.myRestartTimer();
        }
        return 0;
    },

    onLocationChange: function(aProgress, aRequest, aURI) {
        return 0;
    },

    // For definitions of the remaining functions see XULPlanet.com
    onProgressChange: function() {
        return 0;
    },
    onStatusChange: function() {
        return 0;
    },
    onSecurityChange: function() {
        return 0;
    },
    onLinkIconAvailable: function() {
        return 0;
    }
};

var ProgressListener = new AProgressListener();
