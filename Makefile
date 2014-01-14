SHELL = /bin/sh
prefix = /usr/local
exec_prefix = $(prefix)
bindir = $(exec_prefix)/bin
srcdir = $(CURDIR)
found_location = $(shell which specter)
found_version = $(shell specter --version)
expected_location = $(bindir)/specter
expected_version = specter 0.5


xul: bin/omni.ja bin/application.ini bin/specter bin/specter-remote
	@echo "done."
	@echo "run 'sudo make install' to install"

test:
	cd tests && ./test.sh

install: $(bindir)/specter $(bindir)/specter-remote installcheck update

installcheck: SPECTER-exists
	@echo "Checking for specter in the path...\c"
ifeq ($(found_version), $(expected_version))
	@echo "OK"
else
	@echo "WARNING\n"
	@echo "Specter was found in the path, but not in the expected location"
	@echo "Expected $(expected_version) in $(expected_location)"
	@echo "Found $(found_version) in $(found_location)"
	@echo "If you wish to upgrade, run 'sudo make upgrade'."
endif

uninstall:
	@rm $(bindir)/specter
	@rm $(bindir)/specter-remote

update:
	@echo "Updating .specterrc files"
	@find ~ -type f -name '.specterrc' -print0 | xargs -0 python $(srcdir)/bin/update_rc_files.py

gitpull:
	git pull

upgrade: uninstall clean gitpull xul install

clean:
	@rm bin/specter
	@rm bin/specter-remote
	@rm bin/omni.ja
	@rm bin/application.ini

$(bindir)/specter:
	@ln -s $(srcdir)/bin/specter $(bindir)/specter
	@chmod 755 $(bindir)/specter

$(bindir)/specter-remote:
	@ln -s $(srcdir)/bin/specter-remote $(bindir)/specter-remote
	@chmod 755 $(bindir)/specter-remote

SPECTER-exists:
	@echo "Checking for specter...\c"
	@which specter > /dev/null
	@echo "OK"

bin/application.ini:
	@cp src/application.ini bin/.

bin/omni.ja:
	@cd src; \
		zip -r ../bin/omni.ja chrome defaults chrome.manifest \
			-x defaults/preferences/debug.js **/.DS_Store

bin/specter:
	@cp src/specter bin/.

bin/specter-remote:
	@cp src/specter-remote bin/.

.PHONY : all install uninstall installcheck clean SPECTER-exists \
	PHANTOMJS CASPERJS PYTHON
