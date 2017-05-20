#!/usr/bin/env bash

RELEASE_DIR=./release

if [ ! -d ./node_modules ]; then
  echo "Wait for a while, let's install dependencies first"
  npm install
fi

if [ "$1" = "build" -o "$1" = "-b" ]; then
  npm run build
fi

if [ -d $RELEASE_DIR ]; then
  rm -r $RELEASE_DIR
fi
mkdir $RELEASE_DIR

ALL_FILES=$(ls .)
BIN_FILES=$(ls ./bin)
EXCEPT_FILES=("node_modules" $(basename $0) $(basename $RELEASE_DIR))

# Copy files to release dir
for file in $ALL_FILES; do
  flag=true
  for efile in ${EXCEPT_FILES[@]}; do
    if [ $file == $efile ]; then
      flag=false
      break
    fi
  done

  if $flag; then
    cp -r $file $RELEASE_DIR
  fi

  unset flag
done

# Install dependencies
pushd $RELEASE_DIR >/dev/null
  npm install --production
popd >/dev/null






