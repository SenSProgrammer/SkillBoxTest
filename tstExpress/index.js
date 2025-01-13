const express = require('express');
const app= express();
let count=0;
app.post('/inc', (req,res) =>{
    count +=1;
    res.send("OK");
});
app.get('/', (req,res) =>{
    res.json({count});
});
const port = process.env.PORT || 3000;
setInterval(()=>{console.log(count);},1000)
app.listen(port,() => {
    console.log("Listening on http://localhost:"+port);
});
