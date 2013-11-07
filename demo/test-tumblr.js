// test the twitter homepage

open("https://tumblr.com/", function() {

    test([1024, 768, 640, 320], function() {
        // first, hide the background image before capturing
        var $ = window.jQuery;
        $('#fullscreen_post_bg').hide();
        // then, capture a couple of elements at four screen widths
        capture(".dash_b_form_header", "form_header");
        capture(".dash_b_form", "login_form");
    });


    // FOR DEMO ONLY:
    // run the tests again with changes, to demonstrate failures
    test([1024, 768, 640, 320], function() {
        // now we can show the background to cause a test failure
        var $ = window.jQuery;
        $('#fullscreen_post_bg').show();
        // recapturing those elements should cause test failures
        capture(".dash_b_form_header", "form_header");
        capture(".dash_b_form", "login_form");
    });

    // always call finish() at the end
    finish();
});
