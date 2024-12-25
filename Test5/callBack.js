fs=require("fs");
fs.readFile("setTimeout.js",(err,data)=> {
    if (err) {
        console.error("Error:", err);
        return;
    }
    console.log(data);
});