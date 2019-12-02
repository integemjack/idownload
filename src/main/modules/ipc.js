exports = module.exports = ipc => {
	ipc.on("cpu", (event, arg) => {
		event.returnValue = "";
	});

	ipc.on("gather", (event, arg) => {
		switch (arg) {
			case "taobaoku":
				break;
		}
	});
};
