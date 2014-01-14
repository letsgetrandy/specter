#! /bin/bash

failures=0
errors=0


# test capturing a new image

echo -n Test capturing a new image...
if [ -f baseline/capture-file-600.png ]; then
    rm baseline/capture-file-600.png
fi
specter testfiles/test-capture.js > /dev/null 2>&1
if [ $? -ne 0 ]; then
    errors=$[$errors + 1]
    echo ERROR
else
    if [ ! -f baseline/capture-file-600.png ]; then
        failures=$[$failures + 1]
        echo FAIL
    else
        echo PASS
        rm baseline/capture-file-600.png
    fi
fi


# test that a mismatch causes a failure

echo -n Test that a mismatch creates a failure...
specter testfiles/test-failure.js > /dev/null 2>&1
if [ $? -ne 1 ]; then
    failures=$[$failures + 1]
    echo FAIL
else
    echo PASS
fi


# test clicking

echo -n Test clicking an element...
specter testfiles/test-click.js > /dev/null 2>&1
if [ $? -ne 0 ]; then
    failures=$[$failures + 1]
    echo FAIL
else
    echo PASS
fi


# Done. Report outcome.

echo
if ([ $failures -eq 0 ] && [ $errors -eq 0 ]); then
    echo SUCCESS! All tests passed.
    exit 0
else
    echo DONE. $errors errors. $failures failures.
    exit -1
fi
