const gauge = require("cpu-gauge");

var cpu = gauge.start();
// ...
console.log(cpu.usage().percent);
