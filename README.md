Specter
=======

Automated visual regression testing.

Specter adds [Resemble.js](http://huddle.github.com/Resemble.js/) image comparison functionality to [CasperJS](http://github.com/n1k0/casperjs) testing and navigation framework for [PhantomJS](http://github.com/ariya/phantomjs/), in order to produce automated visual regression testing.


### Why?

The problem with functional UI tests is that they make assertions on HTML markup, not the actual rendering. You can't know through automated tests if something has visually broke, too much margin, disabled state etc.  This situation is exacerbated by the increasing use of CSS3 for visual state changes that were traditionally built with JavaScript and DOM manipulation, ':target' pseudoclass or keyframes for example. Read more on Huddle's Engineering blog: [CSS Regression Testing](http://tldr.huddle.com/blog/css-testing/).


## Installation

Specter requires [CasperJS](http://github.com/n1k0/casperjs), which can be installed on Mac via Homebrew (`brew install casperjs`) or installed manually on any other system by cloning the repo.

To use Specter, just clone this repo and run `make install` to link the binary into your path and make it executable.

```
$ git clone https://github.com/letsgetrandy/specter.git
$ cd specter
$ make install
```

## Usage

Check out the [demo](http://github.com/letsgetrandy/specter/tree/master/demo) for a full working example (run `specter demo` from the command line).

### Getting screenshots

Specter adds a global `specter` object to your casper tests, with a `screenshot()` method which requires two parameters:

```javascript
specter.screenshot(css_selector, file_name);

  // css_selector:  String. A selector to define what you want to capture
  // file_name   :  String. A descriptor to use when saving the screenshot
```

Just write your [casper functional tests](http://casperjs.org/testing.html) as normal, but have specter capture screenshots as you go.

```javascript
/* global casper:false */

casper
.start('http://localhost/', function () {
    casper.viewport(1024, 600);
    specter.turn_off_animations();
    specter.screenshot("main > .content", "main");
    this.test.assertExists('form#login #id_username', 'username field');
    this.test.assertExists('form#login #id_password', 'password field');
})
.thenOpen('http://localhost/password-reset/', function () {
    specter.screenshot("main > .content", "password-reset");
})
.run(function(){
    this.test.done(0);
});
```

### Comparing

Specter will compare the after the functional tests have finished. Just invoke your tests by calling `specter` rather than `casperjs`.

Specter can run a single test file:

```bash
$ specter tests/test-login.js
```

Or, multiple files:

```bash
$ specter tests/test-login.js tests/test-homepage.js tests/test-checkout.js
```

Or, it can recursively run every test file in a specified directory:

```bash
$ specter tests
```


### Options

**--no-color** disables Casper's hideous command-line color scheme

**--ignore-failed-tests** forces Specter to run image comparisons even if the functional tests finished with errors.

**--skip-capture** skips the functional tests and image capture step, and only runs the comparison step against previously collected diffs.


## Workflow

* Define what screenshots you need in your regular tests
* Find the screenshot directory and check that they look as you expect.  These images will be used as a baseline.  Subsequent test runs will report if the latest screenshot is different to the baseline
* Commit/push these baseline images with your normal tests (presuming you're using a version control system)
* Run the tests again.  New screenshots will be created to compare against the baseline image.  These new images can be ignored, they will be replaced every test run. They don't need to be committed
* If there are test failures, image diffs will be generated.


## Configuration

Specter follows standard .rc file behavior.

* Global defaults can be set in `/etc/specterrc`
* User-level settings can be set in `~/.specterrc`
* Project-level settings can be set within the project in a `.specterrc` file in the current working directory, or any directory above it.

```bash
$ cat .specterrc

[paths]
testroot = static/styles/tests
baseline = static/styles/screenshots
diff = /tmp/specter/diff
fail = /tmp/specter/fail

[args]
specter = "--args --to --pass --to --specter/casper"
phantom = "--args --to --pass --to --phantomjs"
```

**paths.testroot** is the folder that contains all the test files to run

**paths.baseline** is the directory in which baseline screen captures should be stored

**paths.diff** is where diff images are stored for comparison later

**paths.fail** is where failure images are stored

**args.specter** are command-line arguments to always pass to specter and/or casper

**args.phantom** are command-line arguments to always pass to phantomjs


_Please note that relative paths in .specterrc files are relative to that file._

_v-0.2 note: the "specter" section in the rc files has been replaced by "paths" and "args" sections._


## Demo

Run all demo tests simply by passing the demo directory as an argument:

```
$ specter demo
```

Or, run a single demo test by passing just that file as an argument:

```
$ specter demo/test-facebook.js
```


--------------------------------------

Maintained by [Randy Hunt](http://github.com/letsgetrandy)

Specter is based on PhantomCSS, originally created by [James Cryer](http://github.com/jamescryer) and the Huddle development team.
