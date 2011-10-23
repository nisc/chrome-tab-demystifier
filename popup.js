function infect() {
  // update the popup elements
  function render(opts) {
    var dateElem = document.getElementById("date");
    var linkElem = document.getElementById("link");

    if(typeof opts !== "undefined" && opts !== null && opts.url != null) {
      // set link href and alt to ref url
      linkElem.href = opts.url;
      linkElem.title = opts.url;

      // check if last visit time timestamp has been provided
      if(opts.time != null) {
        // render date from epoch timestamp
        var time = new Date(opts.time);
        dateElem.innerHTML = 'Last visited: <span class="bold">'
          + time.toLocaleTimeString() + '</span> ('
          + time.toLocaleDateString() + ')';
      } else {
        dateElem.style.display = "none";
      }

      // set link text to referrer title, if provided
      if(opts.title != null) {
        linkElem.innerHTML = opts.title;
      } else {
        linkElem.innerHTML = opts.url;
      }
    }
  }

  // listen for message from content script and receive referrer
  chrome.extension.onRequest.addListener(function(request, sender, sendResp) {
    var refurl = request.ref;

    if(refurl) {
      chrome.history.getVisits({url: refurl}, function(vitems) {
        // get the first match
        if(vitems.length > 0) {
          // get time the referring page was visited
          var vtime = vitems[0].visitTime;
          // using this timestamp, get corresponding history item
          // after that, get lastVisitTime, title, url from result
          chrome.history.search({
            text: "",
            startTime: vtime-50,
            endTime: vtime+50, // obviously, this is a hack
            maxResults: 1 // there should only be one result anyway
          }, function(hitems) {
            if(hitems.length > 0) {
              render({
                title: hitems[0].title,
                url: refurl,
                time: hitems[0].lastVisitTime
              });
            } else {
              // failed to get a history item
              render({
                url: refurl,
                time: vtime
              });
            };
          });
        } else {
          // failed to get a visit entry
          render({
            url: refurl
          });
        }
      });
    }
  });

  // inject script into website which returns us document.referrer
  chrome.tabs.executeScript(null, {
    file: "content.js"
  }, function() {});
}
