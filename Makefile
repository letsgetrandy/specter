SHELL = /bin/sh
prefix = /usr/local
exec_prefix = $(prefix)
bindir = $(exec_prefix)/bin
srcdir = $(CURDIR)
found_location = $(shell which specter)
found_version = $(shell specter --version)
expected_location = $(bindir)/specter
expected_version = 0.2


all:
	@echo "Nothing to do.\n"
	@echo "Did you mean to run 'make install'?\n"

install: PHANTOMJS CASPERJS PYTHON $(bindir)/specter installcheck

installcheck: SPECTER-exists
	@echo "Checking for specter in the path...\c"
ifeq ($(found_location), $(expected_location))
	@echo "OK"
else
	@echo "WARNING\n"
	@echo "Specter was found in the path, but not in the expected location"
	@echo "Expected v$(expected_version) in $(expected_location)"
	@echo "Found v$(found_version) in $(found_location)"
endif

uninstall:
	rm $(srcdir)/specter

clean:
	@echo "Nothing to clean."

$(bindir)/specter:
	@ln -s $(srcdir)/bin/specter $(bindir)/specter
	@chmod 755 $(bindir)/specter

SPECTER-exists:
	@echo "Checking for specter...\c"
	@which specter > /dev/null
	@echo "OK"

PHANTOMJS:
	@echo "Checking for PhantomJS...\c"
	@which phantomjs > /dev/null
	@echo "OK"

CASPERJS:
	@echo "Checking for CasperJS...\c"
	@which casperjs > /dev/null
	@echo "OK"

PYTHON:
	@echo "Checking for Python...\c"
	@which python > /dev/null
	@echo "OK"

.PHONY : all install uninstall installcheck clean SPECTER-exists \
	PHANTOMJS CASPERJS PYTHON
