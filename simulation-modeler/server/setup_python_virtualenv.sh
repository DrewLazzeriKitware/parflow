#!/bin/bash
python3 -m virtualenv -p python3.7 venv
source venv/bin/activate
python -m pip install -r requirements.txt
