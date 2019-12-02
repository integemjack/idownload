const client = require("scp2");
const package = require("../package.json");
const fs = require("fs");
const path = require("path");
const os = require("os");
const consola = require("consola");
const yaml = require("js-yaml");
const zip = require("./libs/zip");

const upload = (from, to) => {
	return new Promise((resolve, reject) => {
		consola.info(`Starting upload ${from} to ${to} ...`);
		client.scp(from, to, function(err) {
			if (err) return reject(err);
			consola.ready(`Upload ${from} to ${to} is OK!`);
			resolve();
		});
	});
};

(async () => {
	try {
		let file =
			os.platform() === "win32"
				? `iDownloader Setup ${package.version}.exe`
				: `iDownloader-${package.version}.dmg`;
		let zipFile =
			os.platform() === "win32" ? `iDownloader ${package.version}.zip` : `iDownloader-${package.version}-mac.zip`;

		if (os.platform() === "win32") {
			consola.info(`Starting zip win files...`);
			await zip(path.join(process.cwd(), "build/win-unpacked"), path.join(process.cwd(), `build/${zipFile}`));
		}
		if (process.argv[2] || process.argv[2] === "all") {
			await upload(
				path.join(process.cwd(), `build/${file}`),
				"root:cc880108@player.integem.com:/home/DATA/tools/download/iDownloader/"
			);
			await upload(
				path.join(process.cwd(), `build/${zipFile}`),
				"root:cc880108@player.integem.com:/home/DATA/tools/download/iDownloader/"
			);
		}
		await upload(
			"root:cc880108@player.integem.com:/home/DATA/tools/download/iDownloader/info.yml",
			path.join(process.cwd(), `build/info.yml`)
		);
		let info = yaml.safeLoad(fs.readFileSync(path.join(process.cwd(), `build/info.yml`), "utf8"));
		consola.ready(`Starting process info.yml ...`);
		switch (os.platform()) {
			case "win32":
				info.download.win32 = file;
				info.download.win32_zip = zipFile;
				break;

			case "darwin":
				info.download.darwin = file;
				info.download.darwin_zip = zipFile;
				break;
		}
		consola.info(yaml.safeDump(info));
		fs.writeFileSync(path.join(process.cwd(), `build/info.yml`), yaml.safeDump(info));
		consola.ready(`Process info.yml is OK!`);
		await upload(
			path.join(process.cwd(), `build/info.yml`),
			"root:cc880108@player.integem.com:/home/DATA/tools/download/iDownloader/info.yml"
		);
	} catch (e) {
		consola.error(e);
	}
})();
