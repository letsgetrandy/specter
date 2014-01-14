// test the click function

open('fixture.html', function() {

    // capture some elements at 1024x600
    test(600, function() {
        capture("#test_click", "unclicked");
    });

    click('#test_click');

    test(600, function() {
        capture("#test_click", "clicked");
    });

    // always call finish() at the end
    finish();
});
