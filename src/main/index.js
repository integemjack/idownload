const fs = require("fs");
const path = require("path");

import { app, BrowserWindow, powerSaveBlocker, ipcMain, Menu, MenuItem } from "electron";

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== "development") {
	global.__static = require("path")
		.join(__dirname, "/static")
		.replace(/\\/g, "\\\\");
}

let mainWindow, sleepId;
const winURL = process.env.NODE_ENV === "development" ? `http://localhost:9080` : `file://${__dirname}/index.html`;

function createWindow() {
	/**
	 * Initial window options
	 */
	let width = process.env.NODE_ENV === "development" ? 1200 : 1200;
	let height = 750;
	let _package_file = path.join(process.cwd(), "package.json");
	if (!fs.existsSync(_package_file)) _package_file = path.join(__dirname, "../../package.json");
	let _package = JSON.parse(fs.readFileSync(_package_file));

	// if (process.platform === "darwin") {
	const template = [
		{
			label: "Application",
			submenu: [
				{
					label: "Quit",
					accelerator: "Command+Q",
					click: function() {
						app.quit();
					}
				}
			]
		},
		{
			label: "Edit",
			submenu: [
				{
					label: "Copy",
					accelerator: "CmdOrCtrl+C",
					selector: "copy:"
				},
				{
					label: "Paste",
					accelerator: "CmdOrCtrl+V",
					selector: "paste:"
				},
				{
					label: "Cut",
					accelerator: "CmdOrCtrl+X",
					selector: "cut:"
				}
			]
		},
		{
			label: "Debug",
			submenu: [
				{
					label: "Debug",
					accelerator: "F12",
					click: function() {
						mainWindow.webContents.openDevTools();
					}
				}
			]
		},
		{
			label: `About`,
			submenu: [
				{
					label: `Version: ${_package.version}`
				}
			]
		}
	];
	Menu.setApplicationMenu(Menu.buildFromTemplate(template));
	// } else {
	// 	Menu.setApplicationMenu(null);
	// }

	mainWindow = new BrowserWindow({
		title: "iDownloader",
		height: height,
		minHeight: height,
		// useContentSize: true,
		width: width,
		minWidth: width
		// frame: false
		// titleBarStyle: "hiddenInset"
	});

	// mainWindow.webContents.openDevTools();

	mainWindow.loadURL(winURL);

	mainWindow.on("closed", () => {
		mainWindow = null;
	});

	// 打开省电拦截
	sleepId = powerSaveBlocker.start("prevent-display-sleep");

	// load module
	require("./modules/ipc")(ipcMain);
}

app.on("ready", () => {
	createWindow();
});

app.on("window-all-closed", () => {
	// 关闭省电拦截
	if (powerSaveBlocker.isStarted(sleepId)) powerSaveBlocker.stop(sleepId);
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	if (mainWindow === null) {
		createWindow();
	}
});

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

import { autoUpdater } from "electron-updater";
import { fstat } from "fs";

// autoUpdater.on("update-downloaded", () => {
//     autoUpdater.quitAndInstall();
// });

ipcMain.on("check-for-update", (event, arg) => {
	// if (process.env.NODE_ENV === "production")
	updateHandle(event, arg);
});

// 检测更新，在你想要检查更新的时候执行，renderer事件触发后的操作自行编写
function updateHandle(event, arg) {
	let message = {
		error: "检查更新出错",
		checking: "正在检查更新……",
		updateAva: "检测到新版本，正在下载……",
		updateNotAva: "现在使用的就是最新版本，不用更新"
	};
	const os = require("os");
	autoUpdater.setFeedURL(arg);
	autoUpdater.on("error", function(error) {
		sendUpdateMessage(event, message.error);
	});
	autoUpdater.on("checking-for-update", function() {
		sendUpdateMessage(event, message.checking);
	});
	autoUpdater.on("update-available", function(info) {
		sendUpdateMessage(event, message.updateAva);
	});
	autoUpdater.on("update-not-available", function(info) {
		sendUpdateMessage(event, message.updateNotAva);
	});

	// 更新下载进度事件
	autoUpdater.on("download-progress", function(progressObj) {
		event.sender.send("downloadProgress", progressObj);
	});
	autoUpdater.on("update-downloaded", function(ev, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) {
		ipcMain.on("isUpdateNow", (e, arg) => {
			//some code here to handle event
			autoUpdater.quitAndInstall();
		});
		event.sender.send("isUpdateNow");
	});

	//执行自动更新检查
	autoUpdater.checkForUpdates();
}

// 通过main进程发送事件给renderer进程，提示更新信息
// mainWindow = new BrowserWindow()
function sendUpdateMessage(event, text) {
	event.sender.send("message", text);
}
