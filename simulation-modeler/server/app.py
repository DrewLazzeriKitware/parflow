# Activate virtual env
import sys

if "--virtual-env" in sys.argv:
    virtualEnvPath = sys.argv[sys.argv.index("--virtual-env") + 1]
    virtualEnv = virtualEnvPath + "bin/activate_this.py"
    with open(virtualEnv) as venv:
        exec(venv.read(), dict(__file__=virtualEnv))

import argparse

# JsonRPC / PubSub
from paraview.web import pv_wslink
from paraview.web import protocols as pv_protocols
from paraview import servermanager

# graphics
from paraview import simple

# protocol
from modeler import api


class PVWServer(pv_wslink.PVServerProtocol):
    authKey = "wslink-secret"
    viewportScale = 1.0
    viewportMaxWidth = 2560
    viewportMaxHeight = 1440
    settingsLODThreshold = 102400

    @staticmethod
    def add_arguments(parser):
        parser.add_argument(
            "--virtual-env", default=None, help="Path to virtual environment to use"
        )
        parser.add_argument(
            "--data",
            default="",
            help="Path to simulation directory",
            dest="runDirectory",
        )

    @staticmethod
    def configure(args):
        PVWServer.runDirectory = args.runDirectory
        PVWServer.authKey = args.authKey

    def initialize(self):
        self.registerVtkWebProtocol(api.DataFlow(runDirectory=self.runDirectory))
        self.updateSecret(PVWServer.authKey)


if __name__ == "__main__":
    from wslink import server

    parser = argparse.ArgumentParser(description="Parflow simulation modeler")

    # wslink and this minimal example each have cli options
    server.add_arguments(parser)
    PVWServer.add_arguments(parser)

    args = parser.parse_args()

    # wslink adn this minimal example each consume cli options
    PVWServer.configure(args)
    server.start_webserver(options=args, protocol=PVWServer)
