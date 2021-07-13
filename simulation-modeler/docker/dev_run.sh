#!/bin/bash
./build_all.sh
docker run -it \
  -v ${PWD}/bundle/launcher:/pvw/launcher \
  -p 9000:80 \
  simulation-modeler
