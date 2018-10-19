var puppeteer = require("puppeteer");
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
  },
  async setEvents(socket) {
    // Create a Shadow event tracker on puppeteer
    await page.exposeFunction("notifySocket", (...data) => {
      socket.emit(...data);
    });
    await page.evaluate(function observeDom() {
      // expose the observer which will watch
      //More Details https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
      // select the target node
      var target = document.querySelector(".c-city__digitalClock");
      // create an observer instance
      var observer = new MutationObserver(function(mutations) {
        // Do something on change
        notifySocket("refreshAsap", target.innerText); // <-- trigger the event whenever there is a change
      });

      // configuration of the observer:
      var config = { childList: true, subtree: true };
      // pass in the target node, as well as the observer options
      observer.observe(target, config);
    });
  }
};

module.exports = scraper;
