import { mapActions } from "vuex";

import WorkflowContent from "simput/src/components/core/WorkflowContent";
import WorkflowMenu from "simput/src/components/core/WorkflowMenu";
import ViewSelector from "simulation-modeler/src/components/ViewSelector";
import SoilSelector from "simulation-modeler/src/components/SoilSelector";
import FilteredView from "simulation-modeler/src/components/FilteredView";
import Error from "simulation-modeler/src/components/Error";
import Overview from "simulation-modeler/src/components/Overview";

export default {
  name: "App",
  components: {
    Overview,
    WorkflowContent,
    WorkflowMenu,
    ViewSelector,
    SoilSelector,
    FilteredView,
    Error
  },
  data: () => ({
    drawerOpen: true
  }),
  mounted() {
    this.connect();
  },
  methods: {
    ...mapActions({
      connect: "WS_CONNECT",
      save: "SIMPUT_SAVE",
      run: "WS_RUN"
    })
  }
};
