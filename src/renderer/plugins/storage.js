import Vue from "vue";
const Storage = {};

Storage.get = name => {
	if (localStorage.getItem(name) === "" || localStorage.getItem(name) === "{}") return false;
	return JSON.parse(localStorage.getItem(name));
};

Storage.set = function(name, val) {
	localStorage.setItem(name, JSON.stringify(val));
};

Storage.remove = function(name) {
	localStorage.removeItem(name);
};

Vue.prototype.$local = Storage;

export default Storage;
