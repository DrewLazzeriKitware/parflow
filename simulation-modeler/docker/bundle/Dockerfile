ARG WEB_IMAGE=simulation-modeler-web
ARG SERVER_IMAGE=simulation-modeler-pvw
FROM ${WEB_IMAGE} AS web
FROM ${SERVER_IMAGE}

# Name collision: this overshadows pftools 
RUN rm /opt/paraview/lib/python3.6/site-packages/parflow.py

COPY server/requirements.txt /pvw/requirements.txt
COPY server /pvw/server
COPY --from=web /dist /pvw/www
