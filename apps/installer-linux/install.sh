#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Ensure python3 is available
if ! command -v python3 &>/dev/null; then
    echo "Python 3 is required to run the BetterGravity installer."
    exit 1
fi

exec python3 "$DIR/bettergravity-installer.py" "$@"
