setInterval(()=>{console.log("Working ...")

},1000);

process.on("SIGTERM", (exitCode)=>{
  console.error("Terminating with code:", exitCode);
  process.exit(1);
})
