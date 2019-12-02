const fs = require("fs");
const path = require("path");

const archiver = require("archiver");
const consola = require("consola");

const zip = (dir, filename) => {
	return new Promise((reslove, reject) => {
		let output = fs.createWriteStream(filename);
		let archive = archiver("zip", {
			zlib: {
				level: 9
			} // Sets the compression level.
		});

		output.on("close", function() {
			consola.info(archive.pointer() + " total bytes");
			consola.info("archiver has been finalized and the output file descriptor has closed.");
			reslove(archive.pointer());
		});

		archive.on("error", function(err) {
			consola.error(err);
			reject(err);
		});

		archive.pipe(output);

		// append files from a sub-directory and naming it `new-subdir` within the archive
		// let dirs = dir.split(/[\/|\\]/)
		// let name = dirs[dirs.length - 1] !== '' ? dirs[dirs.length - 1] : dirs[dirs.length - 2]
		archive.directory(dir, false);

		archive.finalize();
	});
};

module.exports = zip;
