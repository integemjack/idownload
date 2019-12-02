import Vue from "vue";

const has = (arr, value) => {
	let results = [];

	arr.forEach(v => {
		let r = [],
			l = 0;
		for (let key in value) {
			l++;
			if (v[key] === value[key]) r.push("");
		}
		// console.log(r.length, l, r.length === l);
		if (r.length === l) results.push(v);
	});
	// console.log(
	//     // results,
	//     // results.length,
	//     // results.length === 0,
	//     results.length === 0 ? false : results
	// );
	return results.length === 0 ? false : results;
};

Vue.prototype.$has = has;

export default has;
