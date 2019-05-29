#!/bin/bash -e

export FELFELE_KEYSTORE_STOREPASS=$(security find-generic-password -s 'Felfele android keystore' -w)
export FELFELE_KEYSTORE_KEYPASS=$(security find-generic-password -s 'Felfele android upload key' -w)
