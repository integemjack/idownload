import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

//
const files = require.context("./vuex", false, /\.js$/);
const modules = {};

files.keys().forEach(key => {
	modules[key.replace(/(\.\/|\.js)/g, "")] = files(key).default;
});

export default new Vuex.Store({
	modules,
	strict: process.env.NODE_ENV !== "production"
});
