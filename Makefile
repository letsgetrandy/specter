SHELL = /bin/sh
prefix = /usr/local
exec_prefix = $(prefix)
bindir = $(exec_prefix)/bin
srcdir = $(CURDIR)
found_location = $(shell which specter)
found_version = $(shell specter --version)
expected_location = $(bindir)/specter
expected_version = 0.3


xul: bin/omni.ja bin/application.ini bin/specter

install: $(bindir)/specter installcheck update

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

update:
	@echo "Updating .specterrc files"
	@find ~ -type f -name '.specterrc' -print0 | xargs -0 python $(srcdir)/bin/update_rc_files.py

clean:
	rm bin/specter
	rm bin/omni.ja
	rm bin/application.ini

$(bindir)/specter:
	@ln -s $(srcdir)/bin/specter $(bindir)/specter
	@chmod 755 $(bindir)/specter

SPECTER-exists:
	@echo "Checking for specter...\c"
	@which specter > /dev/null
	@echo "OK"

bin/application.ini:
	cp src/application.ini bin/.

bin/omni.ja:
	cd src; \
		zip -r ../bin/omni.ja chrome defaults chrome.manifest

bin/specter:
	cp src/specter bin/.

.PHONY : all install uninstall installcheck clean SPECTER-exists \
	PHANTOMJS CASPERJS PYTHON
