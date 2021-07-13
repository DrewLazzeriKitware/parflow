#!/bin/bash
cd `dirname $0`
source venv/bin/activate
mkdir -p parflow
cp src/*.js parflow/
python src/model_builder.py -d ../../pf-keys/definitions -o parflow
Simput compile -c parflow/ -o parflow/ -t parflow
cp parflow/parflow.js ../public/parflow.js
jq '' < parflow/model.json > parflow/readable.json
