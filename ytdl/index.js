const yts = require("yt-search");

process.on("message", txt => {
	yts(txt, function(err, r) {
		if (err) return process.send([]); //console.log("[]")
		process.send(r.videos);
		// console.log(JSON.stringify(r.videos))
	});
});
