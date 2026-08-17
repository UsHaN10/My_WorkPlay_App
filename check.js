const { Task } = require("./server/models");

console.log("Checking database...");
Task.findAll().then(tasks => {
    console.log(JSON.stringify(tasks.map(t => ({ id: t.id, title: t.title, status: t.status })), null, 2));
}).catch(console.error);
