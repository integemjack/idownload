<template>
    <div id="app">
        <b-progress class="bar" height="1px" v-if="percent > 0" :value="percent"></b-progress>
        <div class="main">
            <router-view :class="['content']"></router-view>
        </div>
    </div>
</template>

<script>
export default {
	name: "app",
	data() {
		return {
			percent: 0
		};
	},
	watch: {},
	computed: {},
	beforeMount: function() {},
	mounted: function() {
		this.$electron.ipcRenderer.on("message", (e, data) => {});

		this.$electron.ipcRenderer.on("downloadProgress", (e, data) => {
			this.percent = data.percent;
		});

		this.$electron.ipcRenderer.on("isUpdateNow", e => {
			this.percent = 100;
		});

		this.$electron.ipcRenderer.send("check-for-update", "https://server.integem.com/tool/");
	}
};
</script>

<style scoped>
* {
	padding: 0;
	margin: 0;
	list-style: none;
	font-family: "Titillium Web", Roboto, -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Segoe UI", "Oxygen",
		"Ubuntu", "Cantarell", "Open Sans", sans-serif;
	user-select: none;
}

div.progress-bar span {
	text-align: left;
	padding-left: 5px;
}

div.main > div.message {
	position: fixed;
	top: 5px;
	right: 5px;
	z-index: 9999;
}

.bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	z-index: 10000;
}
</style>
