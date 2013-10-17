#! python

import sys
import ConfigParser


def opt_move(config, section1, section2, option):
    try:
        config.set(section2, option, config.get(section1, option))
    except ConfigParser.NoSectionError:
        # Create non-existent section
        config.add_section(section2)
        opt_move(config, section1, section2, option)
    else:
        config.remove_option(section1, option)


paths = ['testroot', 'baseline', 'diff', 'fail', 'path']
args = ['specter', 'phantom', 'casper']

for rcfile in sys.argv[1:]:
    print rcfile
    try:
        cp = ConfigParser.SafeConfigParser()
        cp.read(rcfile)

        # update from v0.1
        if 'specter' in cp.sections():
            for k, v in cp.items('specter'):
                if k in paths:
                    opt_move(cp, 'specter', 'paths', k)
                elif k in args:
                    opt_move(cp, 'specter', 'args', k)
                else:
                    pass
            if len(cp.items('specter')) == 0:
                cp.remove_section('specter')

            with open(rcfile, 'wb') as f:
                cp.write(f)

        # update from v0.2
        if cp.has_section('paths'):
            if cp.has_option('paths', 'diff'):
                diffdir = cp.get('paths', 'diff')
                cp.set('paths', 'diffdir', diffdir)
                cp.remove_option('paths', 'diff')
            if cp.has_option('paths', 'fail'):
                cp.remove_option('paths', 'fail')

    except ConfigParser.ParsingError as err:
        print "ERROR: not a valid .specterrc file"


sys.exit(0)
