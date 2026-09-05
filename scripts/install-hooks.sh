#!/bin/sh
# Runs as the `prepare` lifecycle script.
#
# Git hooks only make sense in a git work tree. A container build installs the
# dependencies without one, and a developer convenience must not break that
# build. Deliberately not `lefthook install || true`: that would also swallow a
# real failure, so only the "no work tree" case is skipped here.
set -eu

if [ ! -d .git ]; then
    echo 'prepare: no git work tree, skipping the hook install.'
    exit 0
fi

exec lefthook install
