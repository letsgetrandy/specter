/* global casper:false */

casper
.start("https://www.facebook.com/", function () {
    casper.viewport(1024, 600);
    specter.turn_off_animations();
})
.then(function() {
    // expect some elements
    casper.test.assertExists('#email', 'Email field');
    casper.test.assertExists('#pass', 'Password field');

    specter.screenshot(".loggedout_menubar_container", "loggedout_menubar");
    specter.screenshot("#content > div > div:first-child > div > div > div:first-child", "marketing_text");
    specter.screenshot("#content > div > div:first-child > div > div > div:first-child + div", "signup_form");
})
.run(function(){
    this.test.done(0);
});

