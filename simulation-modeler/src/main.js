import Vue from "vue";
import Vuex from "vuex";
import Vuetify from "vuetify";

import "vuetify/dist/vuetify.min.css";
import "typeface-roboto";

import App from "simulation-modeler/src/components/App";

import store from "simulation-modeler/src/store";

Vue.config.productionTip = false;
Vue.use(Vuex);
Vue.use(Vuetify, {
  icons: {
    simput: {
      add: "mdi-plus",
      warning: "mdi-alert-outline",
      contentCopy: "mdi-content-copy",
      delete: "mdi-delete-outline",
      folder_open: "mdi-folder-outline",
      close: "mdi-close",
      error: "mdi-bug",
      folder: "mdi-folder",
      download: "mdi-cloud-download",
      publish: "mdi-publish",
      ok: "mdi-check-circle-outline",
      check: "mdi-check"
    },
    save: "mdi-content-save",
    run: "mdi-run-fast"
  },
  iconfont: "mdi"
});

new Vue({
  store,
  render: h => h(App)
}).$mount("#app");
