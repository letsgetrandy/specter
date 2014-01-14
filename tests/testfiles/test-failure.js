// test for an error

open('fixture.html', function() {

    test(600, function() {
        capture("#test_failure", "file");
    });

    finish();
});

