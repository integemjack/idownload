import Vue from "vue";

const ytdl = require("ytdl-core");
// const youtubedl = require('youtube-dl')
const fs = require("fs");
const path = require("path");

const request = require("request");
const progress = require("progress-stream");

const ffmpeg = require("ffmpeg-static");
const os = require("os");

const { execFile, execFileSync } = require("child_process");

Vue.prototype.$ffmpeg = (video, cb) => {
	try {
		let ff_paths = video.path.split(".");
		let ff_ext = ff_paths.pop();
		let ff_path = `${ff_paths.join(".")}`;

		let ffmpegPath =
			process.env.NODE_ENV === "production"
				? path.join(
						__dirname,
						"../../../node_modules/ffmpeg-static/bin",
						os.platform(),
						os.arch(),
						os.platform() === "win32" ? "ffmpeg.exe" : "ffmpeg"
				  )
				: ffmpeg.path;

		let opts = [];

		// if (video.startTime !== -1 && video.stopTime !== -1) {
		opts = [
			"-ss",
			video.startTime,
			"-t",
			video.stopTime,
			"-accurate_seek",
			"-i",
			`${video.path}.mp4`,
			"-avoid_negative_ts",
			"1"
		];
		// } else {
		//     opts = [
		//         '-accurate_seek',
		//         '-i', video.path,
		//         '-avoid_negative_ts', '1'
		//     ];
		//     ff_path = `${ff_paths.join('.')}_all_ffmpeg`;
		// }

		if (video.width > 0 && video.height > 0) {
			opts.push("-vf");
			opts.push(`crop=${video.width}:${video.height}:${video.offsetX}:${video.offsetY}`);
		}

		let _path = `${ff_path}.${ff_ext}`;
		if (video.audio) {
			opts.push("-f");
			opts.push("mp3");
			opts.push("-vn");
			_path = `${ff_path}.mp3`;
		}

		opts.push(_path);
		opts.push("-y");

		console.log(ffmpeg);
		execFile(ffmpeg.path, opts, cb);
	} catch (e) {
		cb({
			message: e,
			type: "error"
		});
	}
};

Vue.prototype.$load = url => {
	return new Promise((reslove, reject) => {
		ytdl.getInfo(url, (err, info) => {
			if (err) reject(err);
			reslove(info);
		});
	});
};

const download = (url, file, cb) => {
	let options = {
		url: url,
		encoding: null //当请求的是二进制文件时，一定要设置
	};

	request.get(options).on("response", function(response) {
		let proStream = progress({
			length: response.headers["content-length"],
			time: 500 /* ms */
		});

		proStream.on("progress", function(progress) {
			let percentage = Math.round(progress.percentage);
			cb(null, percentage);
		});
		request
			.get(options)
			.pipe(proStream)
			.pipe(file); //先pipe到proStream再pipe到文件的写入流中
	});
};

Vue.prototype.$realUrl = (url, source) => {
	return new Promise((resolve, reject) => {
		let options = {
			url: url,
			encoding: null //当请求的是二进制文件时，一定要设置
		};

		request.get(url).on("response", function(response) {
			console.log(response.statusCode); // 200
			console.log(response.headers["content-type"]); // 'image/png'
			// resolve(response.statusCode === 200);
			if (response.statusCode === 200) return resolve({ url, change: true });
			let getLink = `${path.join(process.cwd(), `command/idownloader.exe`)}`;
			console.log(process.env.DEV);
			switch (process.platform) {
				case "darwin":
					getLink =
						process.env.DEV === "true"
							? `${path.join(process.cwd(), `command/idownloader`)}`
							: `${path.join(__dirname, `../../../../command/idownloader`)}`;
					break;

				case "linux":
					getLink = `${path.join(process.cwd(), `command/idownloader`)}`;
					break;
			}
			execFile(getLink, [source], (err, out, error) => {
				console.log(err, out, error);
				// if (err || error) return cb(err || error, null);
				// download(out.toString(), file, cb);
				if (err) return reject(err || error);
				if (!JSON.parse(out).success) return reject(JSON.parse(out).data);
				resolve({ url: JSON.parse(out).data, change: false });
			});
		});

		// request(options, function(err, response, body) {
		// 	if (err) return reject(err);
		// 	console.log(response.statusCode);
		// 	// resolve(response.statusCode === 200);
		// 	if (response.statusCode === 200) return resolve({ url, change: true });
		// 	let getLink = `${path.join(process.cwd(), `command/idownloader.exe`)}`;
		// 	console.log(process.env.DEV);
		// 	switch (process.platform) {
		// 		case "darwin":
		// 			getLink =
		// 				process.env.DEV === "true"
		// 					? `${path.join(process.cwd(), `command/idownloader`)}`
		// 					: `${path.join(__dirname, `../../../../command/idownloader`)}`;
		// 			break;
		//
		// 		case "linux":
		// 			getLink = `${path.join(process.cwd(), `command/idownloader`)}`;
		// 			break;
		// 	}
		// 	execFile(getLink, [source], (err, out, error) => {
		// 		console.log(err, out, error);
		// 		// if (err || error) return cb(err || error, null);
		// 		// download(out.toString(), file, cb);
		// 		if (err) return reject(err || error);
		// 		if (!JSON.parse(out).success) return reject(JSON.parse(out).data);
		// 		resolve({ url: JSON.parse(out).data, change: false });
		// 	});
		// });
	});
};

Vue.prototype.$down = (video, cb) => {
	console.log(video);
	try {
		var file = fs.createWriteStream(`${video.path}.mp4`, {
			flags: "w",
			defaultEncoding: "utf8",
			fd: null,
			mode: 0o666,
			autoClose: true
		});

		file.on("finish", () => {
			cb(null, "done");
		});

		file.on("error", err => {
			cb(err, null);
		});

		file.on("open", () => {
			let options = {
				url: video.url,
				encoding: null //当请求的是二进制文件时，一定要设置
			};

			request(options, function(err, response, body) {
				if (err) return cb(err, null);
				//显示进度条
				console.log(response.statusCode);
				if (response.statusCode === 200) {
					download(video.url, file, cb);
				} else {
					let getLink = `${path.join(process.cwd(), `command/idownloader.exe`)}`;
					switch (process.platform) {
						case "darwin":
							getLink =
								process.env.DEV === "true"
									? `${path.join(process.cwd(), `command/idownloader`)}`
									: `${path.join(__dirname, `../../../../command/idownloader`)}`;
							break;

						case "linux":
							getLink = `${path.join(process.cwd(), `command/idownloader`)}`;
							break;
					}
					execFile(getLink, [video.source], (err, out, error) => {
						console.log(err, out, error);
						if (err) return cb(err, null);
						download(JSON.parse(out).data, file, cb);
					});
				}
			});
		});

		cb(null, 0);
	} catch (err) {
		cb(err, null);
	}
};
