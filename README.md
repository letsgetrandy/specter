Specter
=======

Specter is the automated visual regression testing framework that you've been
wishing for.

For most other forms of software development there exist unit testing
frameworks with which a developer can verify that new code does nothing to
break existing code, but for the front-end (UI) developer, there are very few
tools to test design and layout, and the ones that do exist are terribly
clumsy. This has always resulted in a huge need for heavy manual testing and
QA after changes are made, to ensure that a change in one place doesn't break
something somewhere else.

Specter aims to change that. After you've built a page and you know it's right
you can set up a Specter test to prove that page, and each of its individual
components are correctly rendered. Specter will capture screenshots of the
elements matching the selectors you specify, at all the screen dimensions you
desire. Then, just run your suite of Specter tests the next time you make a
change to ensure you haven't broken anything. If something _does_ break, you'll
get a nice screenshot with the differences highlighted in red.


### Requirements

Specter is a XUL application, so it needs Firefox or XULRunner in order to work.


## Installation

To use Specter, just clone this repo and run `make` and `sudo make install`
to link the binary into your path and make it executable.

```
$ git clone https://github.com/letsgetrandy/specter.git
$ cd specter
$ make
$ sudo make install
```

## Usage

Check out the [demo](http://github.com/letsgetrandy/specter/tree/master/demo) for a full working example (run `specter demo` from the command line).


### Quick Start

Create your test file(s). Eg:

```javascript
open("http://www.google.com/", function() {

    test([960, 640, 320], function() {
        capture("#footer", "footer");
    });

    finish();
});
```

Then, invoke specter on your tests. Specter can run a single test file:

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


### Baselines

The first time Specter captures a selector for a particular test, there is
nothing to compare it to, so that capture becomes the _baseline_. After that,
any time that selector is captured for that test, it will be compared to the
baseline.

When you make an intentional change, you'll wish to update the baseline. You
do this with the `--rebase` option.

```bash
# update the baseline for the homepage tests
specter --rebase tests/test-homepage.js
```


## Configuration

Specter follows standard .rc file behavior.

* Global defaults can be set in `/etc/specterrc`
* User-level settings can be set in `~/.specterrc`
* Project-level settings can be set within the project in a `.specterrc` file
in the current working directory, or any directory above it.

```bash
$ cat .specterrc

[paths]
testroot = static/styles/tests
baseline = static/styles/screenshots
diffdir  = /tmp/specter

[hostnames]
mycoolsite = http://localhost:5000
myothersite = http://localhost:8080
```

**testroot** is the folder that contains all the test files to run. No value
is required here, but specifying the root directory of your tests will help
Specter to put your baseline and diff images into more meaningful directories.

**baseline** is the directory in which baseline screen captures should be stored

**diffdir** is where diff images are stored for comparison later. This is
typically a temp directory of some kind.

**[hostnames]** allows you to define custom hostnames where tests should be run.
In this example, `mycoolsite` and `myothersite` are directories directly below
the _testroot_ (`static/styles/tests`), which is a path relative to the
location of the `.specterrc` file.


## Questions?

If have other questions about Specter, what it does, how it works, or why, have
a look at the [FAQ](https://github.com/letsgetrandy/specter/wiki/FAQ), and if
you don't see the answers you're looking for there, contact me!


## Changelog

A list of changes made in each version can be found on the
[releases page](https://github.com/letsgetrandy/specter/releases)

--------------------------------------

Created and maintained by [Randy Hunt](http://github.com/letsgetrandy)

Portions of Specter were inspired by [PhantomCSS](https://github.com/Huddle/PhantomCSS),
and by [SlimerJS](https://github.com/laurentj/slimerjs).
