const util = require('util');
const fs = require('fs');
const stat = util.promisify(fs.stat);
stat("callBack.js")
.then((stats) => {
    console.log(stats);
})
.catch((err) => {
    console.error(err);
});