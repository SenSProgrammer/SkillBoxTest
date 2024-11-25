const generateDate = require("./date.js");

var strFullCurrenDateTime=generateDate.currentDateTime();
var strDate = strFullCurrenDateTime.date;
var strTime = strFullCurrenDateTime.time;
console.log("Today is ", strDate+','," the current time is ", strTime);
console.log("OK");
