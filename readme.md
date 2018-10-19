Copy of answer at [Stackoverflow](https://stackoverflow.com/a/52872159/6161265).

You want to emit event when the data changes. There are multiple ways to do that, such as,

- Try to get new data on interval
- Look for the change and emit from within browser

# Update Code Readability
I will discuss both of them. But first, lets split the code for a better usability. It's completely optional but you should do it.

    /**
     * Scraper
     * Use this instead of scrape variable
     */
    let browser, page;
    const scraper = {
      async open() {
        browser = await puppeteer.launch({ headless: true });
        page = await browser.newPage();
        const url = "https://www.timeanddate.com/worldclock/personal.html";
        await page.goto(url);
        await page.waitFor(300);
      },
      async getTime() {
        return page.evaluate(() => {
          return document.querySelector(".c-city__digitalClock").innerText; // time with seconds 5:43:22am
        });
      }
    };

We can add other methods to this object later if we need. This is not the best format, but this will help us understand the code better at this point.

# Method 1. Set Interval
Let's modify the connection, we just need to open the page once and poll new data on some interval.

    /**
     * Socket Connection Monitor
     */
    io.sockets.on("connection", async function(socket) {
      // open the page once
      await scraper.open();
      
      // start the interval loop
      setInterval(async () => {
    
        // get the time every second
        const time = await scraper.getTime();
    
        // emit the updated time
        socket.emit("refresh", time);
      }, 1000); // how many millisecond we want
    });

# Method 2. Add events to the browser itself.
This is advanced and much more complex, however very accurate.

You can add this inside `scraper` object.
    
    // <-- Pass the socket so it can use it
    async runEvents(socket) {
        // Create a Shadow event tracker on puppeteer
        await page.exposeFunction("emitter", (...data) => {
          socket.emit(...data)
        });
        await page.evaluate(function observeDom() {
          // expose the observer which will watch
          //More Details https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
          // select the target node
          var target = document.querySelector(".c-city__digitalClock");
          // create an observer instance
          var observer = new MutationObserver(function(mutations) {
            // Do something on change
            emitter("refresh", target.innerText); // <-- trigger the event whenever there is a change
          });
    
          // configuration of the observer:
          var config = { childList: true, subtree: true };
          // pass in the target node, as well as the observer options
          observer.observe(target, config);
        });
      }

And then your connection will look like,

    io.sockets.on("connection", async function(socket) {
      await scraper.open();
      await scraper.runEvents(socket); // <-- Pass the socket
    });

How it works,

- When the socket is open,
- We open the browser and page
- We run the events.
  - We setup a custom event which will run `socket.emit` with whatever data it gets
  - We expose the custom event on the `page`.
  - We observe the dom element from then,
  - Whenever there is a little change, we trigger the custom event we made

Here is a visual difference between these two: 

(I used 500ms interval and it's 60 frames per second, so the animation is not catching everything, but it's there, **link to [repo][1]**.)

[![enter image description here][2]][2]

# Difference
The difference between setInterval and the event is, setInterval will check after certain amount of time, while the observer will continuously observe the changes and trigger whenever there is a change.

Which to choose:

- If you like simplicity, go with `setInterval` version.
- If you need precision, go with `observer` version.


  [1]: https://github.com/entrptaher/playground-puppeteer-time.is
  [2]: https://i.stack.imgur.com/ehvHR.gif
