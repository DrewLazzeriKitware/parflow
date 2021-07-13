import _ from "lodash";
import { mapGetters } from "vuex";

// Map between our interface and Simput data model
export default {
  name: "ViewSelector",
  data: () => ({
    selectedView: null
  }),
  computed: {
    ...mapGetters({
      dataModel: "SIMPUT_DATAMANAGER",
      viewMapping: "SIMPUT_VIEW_MAPPING"
    }),
    views() {
      if (this.dataModel) {
        return _.reduce(
          this.dataModel.getMenuList(),
          (viewAccumulator, { label, id, index }, i) => {
            const selectableView = this.viewMapping[label];
            if (selectableView) {
              viewAccumulator.push({ ...selectableView, id, index, key: i });
            }
            return viewAccumulator;
          },
          []
        );
      }
      return [];
    }
  }
};
