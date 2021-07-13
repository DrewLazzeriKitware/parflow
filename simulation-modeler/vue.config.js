const vtkChainWebpack = require("vtk.js/Utilities/config/chainWebpack");

module.exports = {
  chainWebpack: config => {
    // Add project name as alias
    config.resolve.alias.set("pf-simput-dataflow", __dirname);

    // Add vtk.js rules
    vtkChainWebpack(config);
  }
};
