const yts = require("yt-search");

process.on("message", txt => {
	try {
		yts(txt, function(err, r) {
			if (err) return process.send([]); //console.log("[]")
			process.send(null, r.videos);
			// console.log(JSON.stringify(r.videos))
		});
	} catch (e) {
		process.send(e.message);
	}
});
