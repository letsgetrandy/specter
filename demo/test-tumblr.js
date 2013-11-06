// test the twitter homepage

open("https://tumblr.com/", function() {

    // first, hide the background image before capturing
    perform(function() {
        var $ = window.jQuery;
        $('#fullscreen_post_bg').hide();
    });

    // then, capture a couple of elements at four screen widths
    test([1024, 768, 640, 320], function() {
        capture(".dash_b_form_header", "form_header");
        capture(".dash_b_form", "login_form");
    });


    // FOR DEMO ONLY:

        // now we can show the background to cause a test failure
        perform(function() {
            var $ = window.jQuery;
            $('#fullscreen_post_bg').show();
        });

        // recapturing those elements should cause test failures
        test([1024, 768, 640, 320], function() {
            capture(".dash_b_form_header", "form_header");
            capture(".dash_b_form", "login_form");
        });

    // always call finish() at the end
    finish();
});
