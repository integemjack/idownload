import Vue from "vue";
import Router from "vue-router";

Vue.use(Router);

const routes = [
	{
		name: "Index",
		path: "/",
		redirect: "/home",
		meta: {
			title: "首页重定向",
			file: `To /home`
		}
	}
];
const files = require.context("./components", true, /\.vue$/);

files.keys().forEach(key => {
	let file = key.replace(/(\.\/|\.vue)/g, "");

	let fileArray = file.split("/");
	let filename = fileArray.pop().replace(/\b(\w)(\w*)/g, function($0, $1, $2) {
		return $1.toUpperCase() + $2.toLowerCase();
	});
	let dir = fileArray.join("/");
	let dirname = fileArray
		.map(d => {
			return d.replace(/\b(\w)(\w*)/g, function($0, $1, $2) {
				return $1.toUpperCase() + $2.toLowerCase();
			});
		})
		.join("");

	let component = require(`@/components/${file}`).default;

	let route = {
		path: filename.toLowerCase() === "index" ? `/${dir}` : `/${file.toLowerCase()}`,
		name: filename.toLowerCase() === "index" && dirname != "" ? dirname : filename,
		component: component,

		meta: {
			title: component.title,
			nu: 0,
			file: key,
			index: component.index,
			icon: component.icon,
			bottom: component.bottom
		}
	};

	routes.push(route);

	// console.log(`加载文件: ${key} \r\n挂载点: ${route.path} \r\n完成!`);
});

// routes.push({
//     path: "/",
//     name: "Index",
//     redirect: "/home",
//     file: `To /home`
// });

export default new Router({
	routes
});
