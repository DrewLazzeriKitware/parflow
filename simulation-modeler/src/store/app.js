export default {
  state: {
    error: null
  },
  getters: {
    APP_ERROR(state) {
      return state.error;
    }
  },
  mutations: {
    APP_ERROR_SET(state, error) {
      state.error = error;
    },
    APP_ERROR_CLEAR(state) {
      state.error = null;
    }
  }
};
