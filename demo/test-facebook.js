// test the facebook homepage

open('https://www.facebook.com/', function() {

    // capture some elements at 1024x600
    test(['1024x600'], function() {
        capture(".loggedout_menubar_container", "loggedout_menubar");
        capture("#content > div > div:first-child > div > div > div:first-child", "marketing_text");
        capture("#content > div > div:first-child > div > div > div:first-child + div", "signup_form");
    });


    // FOR DEMO ONLY:

        // now lets change the background color
        perform(function() {
            var el = window.document.querySelector('.loggedout_menubar_container');
            el.style.background = 'black';
        });

        // recapturing these elements should cause test failures
        test(['1024x600'], function() {
            capture(".loggedout_menubar_container", "loggedout_menubar");
            capture("#content > div > div:first-child > div > div > div:first-child", "marketing_text");
            capture("#content > div > div:first-child > div > div > div:first-child + div", "signup_form");
        });

    // always call finish() at the end
    finish();
});
