// test for capturing a file

open('fixture.html', function() {

    test(600, function() {
        capture("#test_capture", "file");
    });

    finish();
});
