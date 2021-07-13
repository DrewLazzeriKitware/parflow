import PropertyFactory from "simput/src/components/core/PropertyFactory";

export default {
  name: "VariableTableProperty",
  props: {
    viewData: {
      required: true
    },
    prop: {
      required: true
    }
  },
  components: { PropertyFactory },
  methods: {
    updateTable() {
      // Value is bound by component, but trigger table reactivity and hooks
      this.$emit("change", this.prop.data);
    },
    labelForHeader(header) {
      if (this.tableValue.tableLabels[header]) {
        return this.tableValue.tableLabels[header];
      }
      if (this.prop.ui.domain.row_kinds[header]) {
        return this.prop.ui.domain.row_kinds[header].ui.label;
      }
      return header;
    }
  },
  computed: {
    tableValue() {
      return this.prop.data.value[0] || { rows: [] };
    },
    columnOrder() {
      const order = this.tableValue.tableOrder;
      const columns = this.prop.ui.domain.columns.map(c => c.id);
      columns.sort((first, second) => {
        if (!order[first] && !order[second]) return 0;
        if (order[first] && !order[second]) return -1;
        if (!order[first] && order[second]) return 1;
        if (order[first] > order[second]) return 1;
        if (order[first] < order[second]) return -1;
        return 0;
      });
      return columns;
    },
    variableHeaders() {
      const headers = Object.keys(this.prop.ui.domain.row_kinds);
      return headers.map(this.labelForHeader);
    },
    columnHeaders() {
      const headers = this.columnOrder;
      return headers.map(this.labelForHeader);
    },
    isVisible() {
      return (
        this.prop.show(this.viewData) && this.prop.ui.domain.columns.length
      );
    }
  },
  beforeMount() {
    const update = () => this.$nextTick(this.$forceUpdate);
    this.unsubscribe = this.$store.getters.SIMPUT_DATAMANAGER.subscribe(
      update
    ).unsubscribe;
  },
  beforeDestroy() {
    this.unsubscribe();
  }
};
