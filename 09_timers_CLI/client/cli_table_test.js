import Table from "cli-table";
//const timers=[{a:a, b:b},{a:a, b:b},{a:a, b:b}];

// instantiate
var table = new Table({
  head: ["TimerID", "Описание", "Длительность"],
  colWidths: [10, 30, 15],
});

// table is an Array, so you can `push`, `unshift`, `splice` and friends
table.push(["111", "12", 45], ["21", "22", 39]);

console.log(table.toString());
