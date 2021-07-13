import { mapGetters, mapMutations } from "vuex";

export default {
  name: "Error",
  computed: {
    ...mapGetters({ error: "APP_ERROR" })
  },
  methods: {
    ...mapMutations({ clear: "APP_ERROR_CLEAR" })
  }
};
