#!/usr/bin/env bash
# Downloads Daml Finance V4 DAR packages required for CIP-56 compliance.
# Run this before `daml build`.
#
# Bundle source: https://github.com/digital-asset/daml-finance/releases

set -euo pipefail

BUNDLE_VERSION="sdk/2.9.6"
BUNDLE_FILE="daml-finance-bundle-sdk-2.9.6.tar.gz"
DARS_DIR=".dars"

if [ -d "$DARS_DIR" ] && [ "$(ls -A "$DARS_DIR"/*.dar 2>/dev/null)" ]; then
  echo "Daml Finance DARs already present in $DARS_DIR — skipping download."
  echo "To re-download, remove $DARS_DIR and run again."
  exit 0
fi

echo "Downloading Daml Finance bundle ($BUNDLE_VERSION)..."
mkdir -p "$DARS_DIR"

if command -v gh &>/dev/null; then
  gh release download "$BUNDLE_VERSION" \
    --repo digital-asset/daml-finance \
    --pattern "$BUNDLE_FILE" \
    --dir /tmp
else
  curl -sSL -o "/tmp/$BUNDLE_FILE" \
    "https://github.com/digital-asset/daml-finance/releases/download/$BUNDLE_VERSION/$BUNDLE_FILE"
fi

echo "Extracting to $DARS_DIR..."
tar xzf "/tmp/$BUNDLE_FILE" -C "$DARS_DIR" --strip-components=1
rm -f "/tmp/$BUNDLE_FILE"

echo "Done. $(ls "$DARS_DIR"/*.dar | wc -l) DAR files installed."
