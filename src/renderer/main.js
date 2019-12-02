import Vue from "vue";
import App from "./App.vue";

// 加载主要组件
import store from "./vuex.js";
import router from "./router.js";

// 加载插件
if (!process.env.IS_WEB) Vue.use(require("vue-electron"));
const files = require.context("./plugins", false, /\.js$/);
files.keys().forEach(key => {
	require(`./plugins/${key.replace(/(\.\/|\.js)/g, "")}`);
});
Vue.config.productionTip = false;

new Vue({
	router,
	store,
	el: "#app",
	render: h => h(App)
});
