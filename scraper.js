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
    const url = "http://localhost:8080/timer";
    await page.goto(url);
    await page.waitFor(300);
  },
  async getTime() {
    return page.evaluate(() => {
      return document.querySelector("#timedate").innerText; // time with seconds 5:43:22am
    });
  },
  async runEvents(socket) {
    // Create a Shadow event tracker on puppeteer
    await page.exposeFunction("emitter", (...data) => {
      socket.emit(...data);
    });
    await page.evaluate(function observeDom() {
      // expose the observer which will watch
      //More Details https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
      // select the target node
      var target = document.querySelector("#timedate");
      // create an observer instance
      var observer = new MutationObserver(function(mutations) {
        // Do something on change
        emitter("refreshAsap", target.innerText); // <-- trigger the event whenever there is a change
      });

      // configuration of the observer:
      var config = {
        attributes: true,
        childList: true,
        characterData: true, // observe for any character change
        subtree: true
      };
      // pass in the target node, as well as the observer options
      observer.observe(target, config);
    });
  }
};

module.exports = scraper;
