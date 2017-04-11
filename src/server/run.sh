#!/bin/sh

gunicorn -w 10 -b 0.0.0.0:5000 -n bladdondb_api --pythonpath ./ server:app

