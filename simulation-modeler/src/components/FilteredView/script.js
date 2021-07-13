import _ from "lodash";
import { mapGetters } from "vuex";

import PropertyPanel from "simput/src/components/core/PropertyPanel";

const ALWAYS_HIDE = () => false;

// Map between our interface and Simput data model
export default {
  name: "FilteredView",
  components: { PropertyPanel },
  data: () => ({
    selectedView: null
  }),
  computed: {
    ...mapGetters({
      dataManager: "SIMPUT_DATAMANAGER",
      viewMapping: "SIMPUT_VIEW_MAPPING"
    }),
    filteredPanelData() {
      if (this.dataManager) {
        const propertyGroups = this.dataManager.getPropertyList();
        return _.reduce(propertyGroups, this.hideFilteredProperties, []);
      }
    },
    viewData() {
      if (this.dataManager) {
        return this.dataManager.getActiveViewData();
      }
      return {};
    }
  },
  methods: {
    hideFilteredProperties: function(filteredPropertyGroups, propertyGroup) {
      const activeViewName = this.dataManager.activeViewName;
      const currentView = this.viewMapping[activeViewName];
      if (!currentView || currentView.showAll) {
        filteredPropertyGroups.push(propertyGroup);
        return filteredPropertyGroups;
      }

      // Filter whole group if all props filtered
      propertyGroup.filteredCount = 0;
      _.forEach(propertyGroup.contents, property => {
        const showInput = _.includes(currentView.shownInputs, property.data.id);
        if (!showInput) {
          propertyGroup.filteredCount++;
          property.show = ALWAYS_HIDE;
        }
      });
      if (propertyGroup.filteredCount < propertyGroup.contents.length) {
        filteredPropertyGroups.push(propertyGroup);
      }

      return filteredPropertyGroups;
    }
  }
};
