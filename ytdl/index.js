try {
	const yts = require("yt-search");

	process.on("message", txt => {
		try {
			yts(txt, function(err, r) {
				if (err) return process.send({ err }); //console.log("[]")
				process.send({ videos: r.videos });
				// console.log(JSON.stringify(r.videos))
			});
		} catch (e) {
			process.send({ err: e.message });
		}
	});
} catch (e) {
	process.send({ err: e.message });
}
