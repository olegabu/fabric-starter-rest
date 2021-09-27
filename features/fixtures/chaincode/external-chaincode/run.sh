#! /usr/bin/env sh

echo "Emulation of starting chaincode as an external service"
echo "Assuming this script is packaged into a tar.gz archive along with compiled (or source code) artifacts this script knows how to run"
echo "It's also assumed the target host is intended to start corresponded chaincodes and configured appropriately, e.g. JRE or Nodejs are installed"

if [ -n "${PRODUCE_ERROR_FOR_TESTING}" ]; then
    echo "Error"
    exit 1
fi

echo "Success. PORT: ${PORT}, PACKAGE_ID: ${PACKAGE_ID}"
exit 0
