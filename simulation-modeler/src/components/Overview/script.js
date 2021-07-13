import { mapActions } from "vuex";

import WorkflowMenu from "simput/src/components/core/WorkflowMenu";
import WorkflowContent from "simput/src/components/core/WorkflowContent";

export default {
  name: "Overview",
  components: { WorkflowMenu, WorkflowContent },
  methods: {
    ...mapActions({
      connect: "WS_CONNECT",
      save: "SAVE"
    })
  }
};
