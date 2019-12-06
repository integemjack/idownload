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
			if (err) {
				// return reject(err);
				console.log(err);
				return upload(from, to);
			} else {
				consola.ready(`Upload ${from} to ${to} is OK!`);
				resolve();
			}
		});
	});
};

(async () => {
	try {
		let file, zipFile;
		switch (os.platform()) {
			case "darwin":
				file = `${package.build.productName}-${package.version}.dmg`;
				zipFile = `${package.build.productName}_mac_${package.version}.zip`;
				await zip(path.join(process.cwd(), "build/mac"), path.join(process.cwd(), `build/${zipFile}`));
				break;

			case "win32":
				file = `${package.build.productName} Setup ${package.version}.exe`;
				zipFile = `${package.build.productName}_win_${package.version}.zip`;
				consola.info(`Starting zip win files...`);
				await zip(path.join(process.cwd(), "build/win-unpacked"), path.join(process.cwd(), `build/${zipFile}`));
				break;

			default:
				file = `${package.name}_${package.version}_amd64.deb`;
				zipFile = `${package.build.productName}_linux_${package.version}.zip`;
				consola.info(`Starting zip linux files...`);
				await zip(
					path.join(process.cwd(), "build/linux-unpacked"),
					path.join(process.cwd(), `build/${zipFile}`)
				);
				break;
		}
		// let file = os.platform() === "win32" ? `iPic Setup ${package.version}.exe` : `iPic-${package.version}.dmg`;
		// let zipFile = os.platform() === "win32" ? `iPic ${package.version}.zip` : `iPic-${package.version}-mac.zip`;
		// if (os.platform() === "win32") {
		//   consola.info(`Starting zip win files...`);
		//   await zip(path.join(process.cwd(), "build/win-unpacked"), path.join(process.cwd(), `build/${zipFile}`));
		// }
		if (process.argv[2] || process.argv[2] === "all") {
			if(fs.existsSync(path.join(process.cwd(), `build/${file}`))) await upload(
				path.join(process.cwd(), `build/${file}`),
				`root:cc880108@player.integem.com:/home/DATA/tools/download/${package.build.productName}/`
			);
			if(fs.existsSync(path.join(process.cwd(), `build/${zipFile}`))) await upload(
				path.join(process.cwd(), `build/${zipFile}`),
				`root:cc880108@player.integem.com:/home/DATA/tools/download/${package.build.productName}/`
			);
		}
		await upload(
			`root:cc880108@player.integem.com:/home/DATA/tools/download/${package.build.productName}/info.yml`,
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

			default:
				info.download.linux = file;
				info.download.linux_zip = zipFile;
				break;
		}
		consola.info(yaml.safeDump(info));
		fs.writeFileSync(path.join(process.cwd(), `build/info.yml`), yaml.safeDump(info));
		consola.ready(`Process info.yml is OK!`);
		await upload(
			path.join(process.cwd(), `build/info.yml`),
			`root:cc880108@player.integem.com:/home/DATA/tools/download/${package.build.productName}/info.yml`
		);
	} catch (e) {
		consola.error(e);
	}
})();
