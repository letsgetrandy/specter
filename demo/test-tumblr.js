/* global casper:false */

casper
.start("https://tumblr.com/", function () {
    casper.viewport(1024, 600);
    specter.turn_off_animations();
})
.then(function() {
    // expect some elements
    casper.test.assertExists('#signup_email', 'Email field');
    casper.test.assertExists('#signup_password', 'Password field');
    casper.test.assertExists('#signup_username', 'Username field');

    // turn off the background image before screenshotting
    casper.evaluate(function() {
        jQuery('#fullscreen_post_bg').remove();
    });
    casper.test.assertDoesntExist('#fullscreen_post_bg', 'background should be gone');
})
.then(function() {
    // capture some screenshots
    specter.screenshot(".dash_b_form_header", "form_header");
    specter.screenshot(".dash_b_form", "login_form");
})
.run(function(){
    this.test.done(0);
});
