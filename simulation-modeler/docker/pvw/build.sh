#!/bin/bash

SCRIPT_DIR=`dirname "$0"`
ROOT_DIR=$SCRIPT_DIR/../..

docker build -t simulation-modeler-pvw -f $SCRIPT_DIR/Dockerfile $SCRIPT_DIR
