import _ from "lodash";
import { mapGetters } from "vuex";

// Map between our interface and Simput data model
export default {
  name: "SoilSelector",
  data: () => ({
    name: "Geom"
  }),
  computed: {
    ...mapGetters({ dataModel: "SIMPUT_DATAMANAGER" }),
    soilTypes() {
      if (this.dataModel) {
        const parentView = _.find(this.dataModel.getMenuList(), "children");
        if (parentView) {
          return parentView.children;
        }
      }
      return [];
    },
    activeName() {
      if (this.dataModel) {
        return this.dataModel.activeViewName;
      }
    }
  },
  methods: {
    add() {
      if (this.dataModel) {
        this.dataModel.addView(this.name);
      }
    },
    change(index) {
      if (this.dataModel) {
        this.dataModel.activateView(this.name, index);
      }
    }
  }
};
