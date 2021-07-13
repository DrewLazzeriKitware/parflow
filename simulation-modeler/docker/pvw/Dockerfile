
# To build this image, first change into the directory where this Dockerfile
# lives, then:
#
# sudo docker build -t pvw-v5.6.0-egl .
#
# Or, to specify a different base paraview image:
#
# sudo docker build --build-arg BASE_IMAGE=pv-v5.6.0-osmesa -t pvw-v5.6.0-osmesa .
#
# To run the container and inspect it using the shell:
#
# sudo docker run --runtime=nvidia -P --entrypoint /bin/bash -ti pvw-v5.6.0-egl
#

ARG PARFLOW_IMAGE=parflow-development 
ARG BASE_IMAGE=kitware/paraview:pvw-v5.7.1-osmesa-py3
FROM ${PARFLOW_IMAGE} AS parflow
FROM ${BASE_IMAGE}
USER ubuntu

RUN apt-get update && apt-get install -y --no-install-recommends \
        apache2-dev \
        apache2 \
        libapr1-dev \
        apache2-utils \
        openmpi-bin \
        libopenmpi-dev \
        libopenblas-dev \
        liblapack-dev \
        sudo && \
    rm -rf /var/lib/apt/lists/*

# Bring parflow into image
COPY --from=parflow /opt/parflow /opt/parflow
COPY --from=parflow /opt/hypre   /opt/hypre
COPY --from=parflow /opt/netcdf  /opt/netcdf
COPY --from=parflow /opt/hdf5    /opt/hdf5
COPY --from=parflow /opt/silo    /opt/silo

ENV HYPRE_DIR /opt/hypre
ENV PARFLOW_DIR /opt/parflow

RUN pip3 install --upgrade pip
RUN pip install -r /opt/parflow/python/requirements_all.txt

# Start the container.  If we're not running this container, but rather are
# building other containers based on it, this entry point can/should be
# overridden in the child container.  In that case, use the "start.sh"
# script instead, or you can provide a custom one.
ENTRYPOINT ["/opt/paraviewweb/scripts/server.sh"]
