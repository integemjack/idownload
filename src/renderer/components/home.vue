<template>
	<div id="app" v-loading="videoLoading">
		<el-container>
			<el-aside width="200px" style="overflow-x: hidden;">
				<el-scrollbar style="height: 593px">
					<el-row style="padding-right: 10px">
						<el-col
							v-if="video.statusCode === 200"
							v-for="video in videos"
							:key="video.id"
							style="position: relative"
						>
							<a @click="loadin(video)" style="cursor: pointer">
								<el-image style="width: 100%" :src="video.image" fit="fit"></el-image>
								<!--								<span-->
								<!--									v-if="video.statusCode === 200"-->
								<!--									style="position: absolute; right: 10px; top: 10px; padding: 3px 5px; background: RGBA(255, 0, 0, 0.7); border-radius: 5px; color: #FFF; font-size: 12px;"-->
								<!--									>Source</span-->
								<!--								>-->
								<h1 style="font-size: 12px">{{ video.title }}</h1>
							</a>
						</el-col>
					</el-row>
				</el-scrollbar>
			</el-aside>
			<el-main>
				<!--		<img src="./static/images/logo.png" height="100" style="user-select: none; -webkit-app-region: drag;" />-->
				<div class="header">
					<div class="header-left">
						<el-input placeholder="video keywords" v-model="searchTxt" />
					</div>
					<div class="header-right">
						<!--				<el-button @click="getUrl" type="primary">Paste</el-button>-->
						<el-button @click="search" type="primary" :loading="loading">Search</el-button>
					</div>
				</div>
				<div class="body">
					<video class="video" ref="video" :src="videoUrl" width="100%" controls></video>
					<div
						v-show="selectionVisible"
						@mousedown="selectionDown"
						ref="selection"
						class="crop-selection"
					></div>
					<div v-if="maskVisible" @mousedown="maskDown" ref="mask" class="mask-tracker"></div>
				</div>
				<div class="footer">
					<div ref="frameBar" class="frame-bar footer-left">
						<div @mousedown="dragLeftDown" ref="leftBar" class="flag-left">
							<div v-if="startTime" class="time">{{ calcucateTime(startTime) }}</div>
							<div class="flag-dot flag-dot-left"></div>
						</div>
						<div @mousedown="dragRightDown" ref="rightBar" class="flag-right">
							<div v-if="endTime != duration" class="time">{{ calcucateTime(endTime) }}</div>
							<div class="flag-dot flag-dot-right"></div>
						</div>
					</div>
					<div class="footer-right">
						<!-- <el-button size="medium" @click="crop">crop</el-button> -->
						<el-button
							:class="[{ on: audio }, 'audio']"
							:disabled="!audioChange"
							size="medium"
							@click="audio = !audio"
							>Only Audio
						</el-button>
						<el-button type="primary" @click="down" size="medium" :disabled="download.bar >= 0"
							>{{ download.name }}
						</el-button>
					</div>
				</div>

				<div class="Model">
					<div v-if="visible">
						<div class="model-mask"></div>
						<div class="model-wrap">
							<div class="model">
								<div class="model-content">
									<div class="model-header">
										<div class="model-title">select video loading format</div>
									</div>
									<div class="model-body">
										<select v-model="format.index">
											<option
												v-for="video in format.videos"
												:key="video.index"
												:value="video.index"
												>{{ `${video.mimeType}` }}
											</option>
										</select>
										<br />
										<el-button @click="setVideo">Video</el-button>
										<el-button @click="setAudio">Music</el-button>
									</div>
									<div class="model-footer">
										<div class="btn-area">
											<el-button @click="handleCancel" size="medium">Cancel</el-button>
											<el-button @click="handleConfirm" type="primary" size="medium"
												>Confirm
											</el-button>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</el-main>
		</el-container>
	</div>
</template>

<script>
const fs = require("fs");
const path = require("path");
const os = require("os");
const { dialog } = require("electron").remote;
const moment = require("moment");
import { isNumber } from "util";
const request = require("request");

const clipboard = require("electron").clipboard;

const { execFileSync, fork } = require("child_process");

export default {
	name: "app",
	data() {
		return {
			searchTxt: "",
			videos: [],
			inputVideoUrl: "",
			loading: false,
			videoLoading: false,
			videoUrl: "",
			format: {
				title: "",
				videos: [],
				index: 0
			},
			download: {
				bar: -1,
				name: "Download"
			},
			maskVisible: false,
			selectionVisible: false,
			visible: false,
			offsetX: 0,
			offsetY: 0,
			width: 0,
			height: 0,
			startTime: 0,
			endTime: 0,
			duration: 0,
			audio: false,
			audioChange: true,
			source: {
				width: 0,
				height: 0
			},
			version:
				process.env.NODE_ENV !== "development"
					? JSON.parse(fs.readFileSync(path.join(__dirname, "../../package.json"))).version
					: JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"))).version,
			project: path.join(os.tmpdir(), "iCreatorProjectPath.txt")
		};
	},
	mounted() {
		setInterval(() => {
			let _path = "";
			if (fs.existsSync(path.join(this.project))) {
				_path = ` - ${fs.readFileSync(path.join(this.project), "utf-8")}`;
			}
			document.title = `iDownload${_path}`;
		}, 1000);
	},
	methods: {
		getUrl() {
			this.inputVideoUrl = clipboard.readText();
		},
		search() {
			console.log(path.join(process.cwd(), "ytdl/index.js"));
			this.loading = true;
			let ytdl = fork(path.join(process.cwd(), "ytdl/index.js"));
			console.log(this.searchTxt);
			let r = ytdl.send(this.searchTxt);
			console.log(r);
			ytdl.on("message", data => {
				console.log(data);
				if (data.err) {
					this.loading = false;
					return this.$message.error(data.err.code);
				}
				if (data.videos.length === 0) {
					this.loading = false;
					return this.$message.info(`No data!`);
				}
				this.videos = data.videos;
				console.log(this.videos);
				ytdl.kill();
				this.videos.forEach(async video => {
					// console.log(video.url);
					try {
						let info = await this.$load(video.url);
						// console.log(info.formats[1].url);

						let _video = document.createElement("audio");
						_video.src = info.formats[1].url;
						_video.onloadedmetadata = () => {
							// this.videoLoading = false;
							video.statusCode = 200;
							this.$forceUpdate();
							this.loading = false;
						};
					} catch (e) {
						console.log(e);
					}
				});
			});
		},
		loadin(video) {
			this.inputVideoUrl = video.url;
			this.videoLoadIn();
		},
		setAudio() {
			this.format.index = this.format.videos.filter(video => /^audio/.test(video.mimeType))[0].index;
		},
		setVideo() {
			this.format.index = this.format.videos.filter(video => /^video/.test(video.mimeType))[0].index;
		},
		videoLoadIn() {
			this.videoLoading = true;
			// this.videoUrl = this.inputVideoUrl;
			console.log(this.inputVideoUrl);
			this.$load(this.inputVideoUrl)
				.then(info => {
					console.log(info);
					this.format.title = info.title;
					this.format.videos = info.formats;
					this.format.index = 0;
					this.visible = true;
					for (let i = 0; i < this.format.videos.length; i++) {
						this.format.videos[i].index = i;
					}
					this.videoLoading = false;
					// this.format.index = 2;
					// this.handleConfirm();
					// this.videoUrl = this.format.videos[this.format.index].url;
				})
				.catch(err => {
					this.videoLoading = false;
					this.$message.error(err.message);
					console.log(err);
				});
		},
		async handleConfirm() {
			console.log(this.format.index);
			this.visible = false;
			this.videoLoading = true;
			// try {
			// this.videoUrl = await
			this.$realUrl(this.format.videos[this.format.index].url, this.inputVideoUrl)
				.then(({ url, change }) => {
					this.audio = !change;
					this.audioChange = change;
					this.videoUrl = url;
					this.videoLoading = false;
					// console.log(this.videoUrl);
					this.$refs.video.onloadedmetadata = () => {
						// this.videoLoading = false;
						this.duration = this.$refs.video.duration;
						this.endTime = this.duration;
						this.source.width = this.$refs.video.videoWidth;
						this.source.height = this.$refs.video.videoHeight;
						console.log(this.source);
					};
				})
				.catch(e => {
					// } catch (e) {
					this.videoLoading = false;
					this.$message.error(e);
				});
		},
		handleCancel() {
			this.visible = false;
		},
		down() {
			let video = this.format.videos[this.format.index];

			video.url = this.videoUrl;
			video.source = this.inputVideoUrl;
			video.startTime = this.startTime;
			video.stopTime = this.endTime - this.startTime;
			video.offsetX = this.offsetX;
			video.offsetY = this.offsetY;
			video.width = this.width;
			video.height = this.height;
			video.audio = this.audio;
			video.container = this.audio ? "mp3" : "mp4";

			if (!fs.existsSync(path.join(this.project))) return this.$message.error("No project config file.");
			let project = fs.readFileSync(this.project, "utf-8");
			console.log(project);

			video.path = path.join(path.join(project), "instruction/music", `a${moment().valueOf()}.wav`);
			this.$down(video, (err, bar) => {
				console.log(err, bar);
				if (err) {
					this.$message.error(err.message);
				} else {
					if (bar === "done") {
						// download finish
						this.download.name = "Process";
						this.$ffmpeg(video, (err, stdout, stderr) => {
							fs.unlinkSync(`${video.path}.mp4`);
							console.log(err, stdout, stderr);
							if (err) {
								this.$message.error(err || stderr);
							} else {
								this.$message(`Process is OK!`);
							}
							this.download.bar = -1;
							this.download.name = "Download";
						});
					} else {
						this.download.bar = bar;
						this.download.name = `${bar} %`;
					}
				}
			});

			// dialog.showSaveDialog(
			// 	{
			// 		//过滤条件
			// 		filters: [{ name: video.container, extensions: [video.container] }]
			// 	},
			// 	res => {
			// 		if (res) {
			// 			video.path = res;
			// 			this.$down(video, (err, bar) => {
			// 				console.log(err, bar);
			// 				if (err) {
			// 					this.$message.error(err.message);
			// 				} else {
			// 					if (bar === "done") {
			// 						// download finish
			// 						this.download.name = "Process";
			// 						this.$ffmpeg(video, (err, stdout, stderr) => {
			// 							fs.unlinkSync(`${video.path}.mp4`);
			// 							console.log(err, stdout, stderr);
			// 							if (err) {
			// 								this.$message.error(err || stderr);
			// 							} else {
			// 								this.$message(`Process is OK!`);
			// 							}
			// 							this.download.bar = -1;
			// 							this.download.name = "Download";
			// 						});
			// 					} else {
			// 						this.download.bar = bar;
			// 						this.download.name = `${bar} %`;
			// 					}
			// 				}
			// 			});
			// 		}
			// 	}
			// );
		},
		crop() {
			if (this.maskVisible) {
				this.maskVisible = false;
				this.selectionVisible = false;
				this.width = 0;
				this.height = 0;
				this.offsetX = 0;
				this.offsetY = 0;
			} else {
				this.maskVisible = true;
			}
		},
		maskDown(e) {
			this.$refs.mask.style.zIndex = 500;
			this.selectionVisible = false;
			let offsetX = e.offsetX;
			let offsetY = e.offsetY;
			let clientX = e.clientX;
			let clientY = e.clientY;
			let flag = true;
			document.onmousemove = e => {
				if (flag) {
					this.selectionVisible = true;
					this.maskMove(e, offsetX, offsetY, clientX, clientY);
				}
			};
			document.onmouseup = () => {
				flag = false;
				if (this.selectionVisible) {
					this.width = this.width - (this.width % 32);
					this.$refs.selection.style.width = `${this.width}px`;
				}
				if (this.$refs.mask) {
					this.$refs.mask.style.zIndex = 300;
				}
			};
		},
		maskMove(e, offsetX, offsetY, clientX, clientY) {
			let width = e.clientX - clientX;
			let height = e.clientY - clientY;
			if (width < 0) {
				if (-width > offsetX) {
					width = offsetX;
					offsetX = 0;
				} else {
					width = -width;
					offsetX = offsetX - width;
				}
			} else {
				if (width + offsetX > this.$refs.mask.offsetWidth) {
					width = this.$refs.mask.offsetWidth - offsetX;
				}
			}

			if (height < 0) {
				if (-height > offsetY) {
					height = offsetY;
					offsetY = 0;
				} else {
					height = -height;
					offsetY = offsetY - height;
				}
			} else {
				if (offsetY + height > this.$refs.mask.offsetHeight) {
					height = this.$refs.mask.offsetHeight - offsetY;
				}
			}
			this.width = width;
			this.height = height;
			this.offsetX = offsetX;
			this.offsetY = offsetY;

			this.$refs.selection.style.left = `${this.offsetX}px`;
			this.$refs.selection.style.top = `${this.offsetY}px`;
			this.$refs.selection.style.width = `${this.width}px`;
			this.$refs.selection.style.height = `${this.height}px`;
		},
		selectionDown(e) {
			let clientX = e.clientX;
			let clientY = e.clientY;
			let offsetX, offsetY;
			let flag = true;
			document.onmousemove = e => {
				if (!flag) return;
				let moveX = e.clientX - clientX;
				let moveY = e.clientY - clientY;
				offsetX = this.offsetX - 0 + moveX;
				offsetY = this.offsetY - 0 + moveY;
				if (offsetX < 0) {
					offsetX = 0;
				}
				if (offsetX > this.$refs.mask.offsetWidth - this.$refs.selection.offsetWidth) {
					offsetX = this.$refs.mask.offsetWidth - this.$refs.selection.offsetWidth;
				}
				if (offsetY < 0) {
					offsetY = 0;
				}
				if (offsetY > this.$refs.mask.offsetHeight - this.$refs.selection.offsetHeight) {
					offsetY = this.$refs.mask.offsetHeight - this.$refs.selection.offsetHeight;
				}
				this.$refs.selection.style.left = `${offsetX}px`;
				this.$refs.selection.style.top = `${offsetY}px`;
			};
			document.onmouseup = () => {
				flag = false;
				this.offsetX = offsetX;
				this.offsetY = offsetY;
			};
		},
		dragLeftDown(e) {
			let Target = e.currentTarget;
			let flag = true;
			document.onmousemove = e => {
				if (flag && e.target == this.$refs.frameBar) {
					if (e.offsetX < this.$refs.rightBar.offsetLeft) {
						Target.style.left = `${e.offsetX}px`;
						let time = this.$refs.video.duration;
						if (!isNaN(time)) {
							this.startTime = Math.floor((e.offsetX / this.$refs.frameBar.offsetWidth) * time);
							if (this.startTime < 0) {
								this.startTime = 0;
							}
						}
					}
				}
			};
			document.onmouseup = e => {
				flag = false;
			};
		},
		dragRightDown(e) {
			let Target = e.currentTarget;
			let flag = true;
			document.onmousemove = e => {
				if (flag && e.target == this.$refs.frameBar) {
					if (e.offsetX > this.$refs.leftBar.offsetLeft) {
						Target.style.left = `${e.offsetX}px`;
						let time = this.$refs.video.duration;
						if (!isNaN(time)) {
							this.endTime = Math.floor((e.offsetX / this.$refs.frameBar.offsetWidth) * time);
							console.log(this.endTime);
						}
					}
				}
			};
			document.onmouseup = e => {
				flag = false;
			};
		},
		calcucateTime(time) {
			let left = time % 3600;
			let hours = (time - left) / 3600;
			if (hours) {
				if (hours < 10) {
					hours = `0${hours}`;
				}
			}
			time = left;
			left = left % 60;
			let minutes = (time - left) / 60;
			if (minutes || hours || 1) {
				if (minutes < 10) {
					minutes = `0${minutes}`;
				}
			}
			let seconds = left;
			console.log(seconds);
			if (seconds || minutes || hours || 1) {
				if (seconds < 10) {
					seconds = `0${seconds}`;
				}
			}
			if (hours) {
				return `${hours}:${minutes}:${seconds}`;
			} else {
				return `${minutes}:${seconds}`;
			}
		}
	}
};
</script>

<style>
.el-scrollbar__wrap {
	overflow-x: hidden !important;
}

#app {
	font-family: "Avenir", Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-align: center;
	color: #2c3e50;
	width: 1040px;
	margin: 0 auto;
}

.content {
	padding: 10px 0 0 0;
}

.header,
.footer {
	display: flex;
	flex-direction: row;
}

.header .header-left,
.footer .footer-left {
	flex: 1;
	margin-right: 20px;
}

.body {
	position: relative;
	width: 800px;
	padding: 0;
	margin: 0;
	margin-top: 20px;
}

.video {
	width: 800px;
	height: 450px;
	padding: 0;
	margin: 0;
	background: #000;
}

.mask-tracker {
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	background-color: rgba(0, 0, 0, 0.65);
	cursor: crosshair;
	z-index: 300;
}

.footer {
	margin-top: 20px;
}

.footer .footer-left {
	/* background: #2c3e50; */
	background: #e8e8e8;
}

.crop-selection {
	position: absolute;
	border: 1px solid white;
	opacity: 0.7;
	cursor: move;
	z-index: 400;
}

input {
	width: 100%;
}

.model-mask {
	position: fixed;
	top: 0;
	right: 0;
	left: 0;
	bottom: 0;
	background-color: #373737;
	background-color: rgba(0, 0, 0, 0.65);
	z-index: 1000;
}

.model-wrap {
	display: flex;
	position: fixed;
	justify-content: center;
	overflow: auto;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	z-index: 1000;
}

.model {
	width: 520px;
	margin-top: 100px;
}

.model-content {
	position: relative;
	background-color: #fff;
	border: 0;
	border-radius: 4px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.model-title {
	margin: 0;
	font-size: 16px;
	line-height: 22px;
	font-weight: 500;
	color: rgba(0, 0, 0, 0.85);
}

.model-header {
	padding: 16px 24px;
	border-radius: 4px 4px 0 0;
	background: #fff;
	color: rgba(0, 0, 0, 0.65);
	border-bottom: 1px solid #e8e8e8;
}

.model-body {
	padding: 24px;
	font-size: 14px;
	line-height: 1.5;
	word-wrap: break-word;
}

.model-footer {
	border-top: 1px solid #e8e8e8;
	padding: 10px 16px;
	text-align: right;
	border-radius: 0 0 4px 4px;
}

.model-footer .btn-primary {
	margin-left: 8px;
	margin-bottom: 0;
	background-color: #1890ff;
	color: white;
}

.btn {
	line-height: 1.5;
	display: inline-block;
	font-weight: 400;
	text-align: center;
	cursor: pointer;
	background-image: none;
	border: 1px solid transparent;
	white-space: nowrap;
	padding: 0 15px;
	font-size: 14px;
	border-radius: 4px;
	height: 32px;
	position: relative;
	color: rgba(0, 0, 0, 0.65);
	background-color: #fff;
	border-color: #d9d9d9;
	width: auto;
}

.frame-bar {
	position: relative;
}

.flag-left,
.flag-right {
	position: absolute;
	display: flex;
	align-items: center;
	height: 100%;
	width: 2px;
	background: red;
	background: #ffffff url(./static/images/dot.gif);
}

.flag-left {
	left: 0;
}

.flag-right {
	right: 0;
}

.flag-dot {
	position: absolute;
	width: 8px;
	height: 8px;
	background: #333333;
	border: 1px #eeeeee solid;
	font-size: 1px;
	opacity: 0.5;
	cursor: pointer;
}

.flag-dot-left {
	left: -3px;
}

.flag-dot-right {
	left: -3px;
}

.time {
	position: absolute;
	top: -20px;
}

.logs {
	padding: 10px;
	border: 1px #ccc solid;
}

.logs ul li {
	text-align: left;
	border-top: 1px #ccc solid;
	padding: 5px;
}

.logs ul li:first-child {
	border-top: none;
}

.logs ul li.info {
	color: green;
}

.logs ul li.done {
	color: #000;
}

.audio.on,
.audio.on:hover,
.audio.on:active,
.audio.on:focus {
	background: green;
	border: none;
	color: #fff;
}
</style>
