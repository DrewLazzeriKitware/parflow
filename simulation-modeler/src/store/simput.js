import CellProperty from "simput/src/components/properties/CellProperty";
import EnumProperty from "simput/src/components/properties/EnumProperty";
import VariableTableProperty from "simulation-modeler/src/components/VariableTableProperty";

import Bridge from "simulation-modeler/src/core/pfSimputBridge";
import viewMapping from "simulation-modeler/src/core/viewMapping";
import HookManager from "simput/src/core/HookManager";

const bridge = new Bridge();

export default {
  state: {
    dataManager: null,
    viewMapping
  },
  getters: {
    SIMPUT_OUTPUT_GET(state) {
      return state.dataManager && state.dataManager.getOutput();
    },
    SIMPUT_VIEW_MAPPING(state) {
      return state.viewMapping;
    },
    SIMPUT_DATAMANAGER(state) {
      return state.dataManager;
    },
    SIMPUT_COMPONENT_GET() {
      return function(componentName) {
        return {
          cell: CellProperty,
          enum: EnumProperty,
          variable_table: VariableTableProperty
        }[componentName];
      };
    }
  },
  mutations: {
    SIMPUT_DATAMANAGER_SET(state, value) {
      state.dataManager = value;
    }
  },
  actions: {
    SIMPUT_INIT({ commit }, pfRun) {
      /* eslint-disable no-undef */
      // Simput global
      Simput.types["parflow"].hooks(HookManager);
      /* eslint-enable*/
      const modelManager = bridge.getSimputModel(pfRun);
      commit("SIMPUT_DATAMANAGER_SET", modelManager);
    },
    SIMPUT_SAVE({ state, dispatch }) {
      dispatch("WS_SAVE", {
        debug: state.dataManager.getOutput(),
        converted: state.dataManager.getOutput()["pftools"]
      });
    }
  }
};
