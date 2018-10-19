var app = require("express")();
var server = require("http").createServer(app);
var io = require("socket.io").listen(server);
const path = require("path");
var scraper = require("./scraper");

app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname + "/main.html"));
});

server.listen(8080);

/**
 * Socket Connection Monitor
 */
io.sockets.on("connection", async function(socket) {
  // open the page once
  await scraper.open();

  // run observer
  await scraper.setEvents(socket);

  // start the interval loop
  setInterval(async () => {
    // get the time every second
    const time = await scraper.getTime();

    // emit the updated time
    socket.emit("refresh", time);
  }, 1000); // how many millisecond we want
});
