const fs = require("fs");
const fsext = require("fs-extra");
const path = require("path");
const del = require("del");

del.sync(["command"]);

if (!fs.existsSync(path.join(process.cwd(), "command"))) fs.mkdirSync(path.join(process.cwd(), "command"));

try {
	//  && cp -r ./node_modules/electron ./command/ && cp -r ./node_modules/nightmare/lib/ ./command/nightmare
	fsext.copySync(path.join(process.cwd(), "node_modules/electron"), path.join(process.cwd(), "command/electron"));
	fsext.copySync(
		path.join(process.cwd(), "node_modules/nightmare/lib"),
		path.join(process.cwd(), "command/nightmare")
	);
} catch (e) {
	console.log(e);
	process.exit(-1);
}
