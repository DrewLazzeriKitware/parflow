#!/bin/bash

SCRIPT_DIR=`dirname "$0"`
ROOT_DIR=$SCRIPT_DIR/../..

echo $ROOT_DIR
docker build -t simulation-modeler -f $SCRIPT_DIR/Dockerfile $ROOT_DIR
