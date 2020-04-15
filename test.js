const yts = require("yt-search");

yts("iphone", function(err, r) {
	if (err) throw err;

	const videos = r.videos;
	console.log(videos);
	videos.forEach(function(v) {
		const views = String(v.views).padStart(10, " ");
		// console.log( `${ views } | ${ v.title } (${ v.timestamp }) | ${ v.author.name }` )
	});
});
