const Nightmare = require("nightmare");

const NG = Nightmare({
	show: /node/i.test(process.argv0),
	waitTimeout: 1000 * 60 * 60,
	pollInterval: 1000,
	openDevTools: {
		mode: "bottom"
	}
});

const url = process.argv[2];
// console.log(url);

let ng = NG.goto(`https://www.mp3juices.cc/`)
	.wait("body")
	.type("input#query", url)
	// .click("#mp4")
	.click("#button")
	.wait(() => {
		// console.log(document.querySelector("#download").href, document.querySelector("#download").href && document.querySelector("#download").href !== "https://ytmp3.cc/");
		return (
			document.querySelector("#download_0 > div.options > a.url").href &&
			document.querySelector("#download_0 > div.options > a.url").href !== "https://www.mp3juices.cc/"
		);
	})
	// .on("console", function(type, data) {
	// 	// console.error(type);
	// 	console.log(data);
	// })
	.evaluate(() => {
		console.log(document.querySelector("#download_0 > div.options > a.url").href);
		return document.querySelector("#download_0 > div.options > a.url").href;
	})
	.end()
	.then(imgs => {
		// console.log(imgs)
		console.log(
			JSON.stringify({
				success: true,
				data: imgs
			})
		);
	})
	.catch(e => {
		console.log(
			JSON.stringify({
				success: false,
				data: e.message
			})
		);
	});
