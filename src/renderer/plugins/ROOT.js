import Vue from "vue";
import path from "path";

const ROOT = process.env.NODE_ENV === "development" ? process.cwd() : path.join(__dirname, "../../../../");

Vue.ROOT = Vue.prototype.$ROOT = ROOT;

export default ROOT;
