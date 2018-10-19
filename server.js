var app = require("express")();
var server = require("http").createServer(app);
var io = require("socket.io").listen(server);
const path = require("path");
var scraper = require("./scraper");

app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname + "/main.html"));
});

app.get("/timer", function(req, res) {
  res.sendFile(path.join(__dirname + "/timer.html"));
});

server.listen(8080);

io.sockets.on("connection", async function(socket) {
  await scraper.open();
  setInterval(async () => {
    const time = await scraper.getTime();
    socket.emit("refresh", time);
  }, 500);
  await scraper.runEvents(socket);
});
