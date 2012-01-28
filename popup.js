function infect() {
  // update the popup elements
  function render(opts) {
    var dateElem = document.getElementById("date");
    var linkElem = document.getElementById("link");

    if(typeof opts !== "undefined" && opts !== null && opts.url != null) {
      // set link title and href to url
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
      if(typeof opts.title === "string" && opts.title.length > 2) {
        linkElem.innerHTML = opts.title;
      } else {
        linkElem.innerHTML = opts.url;
      }

      // loop through tabs in all windows
      chrome.windows.getAll({ populate: true }, function(windows) {
        // premature optimization is the root of all evil
        var foundit = false;
        for(var i=0; i<windows.length && !foundit; i++) {
          var tabs = windows[i].tabs;
          // cycle through all tabs in window
          for(var j=0; j<tabs.length; j++) {
            if(tabs[j].url.split("#")[0] === opts.url) {
              // found tab with referrer in url, attach click listener
              // to link text that switches to this tab
              var vid = windows[i].id, tid = tabs[j].id;
              linkElem.onclick = function() {
                // first set corresponding window
                chrome.windows.update(vid, {
                  drawAttention: false, // this would only highlight
                  focused: true // but we need ze focus
                });

                // now select corresponding tab (order matters, which I
                // had to find out painfully)
                chrome.tabs.update(tid, {
                  selected: true
                });

                // eat click event
                return false;
              }

              // update popup text
              dateElem.innerHTML += '<br><span class="bold">'
                +'It is still open in another tab!</span>';
              // we found it, so stop looping through windows
              foundit = true;
              break;
            }
          }
        }
      });
    }
  }

  // take referrer string, return object containing title, url, time.
  function getRefInfo(refurl, cb) {
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
              return cb({
                title: hitems[0].title,
                url: refurl,
                time: hitems[0].lastVisitTime
              });
            } else {
              // failed to get a history item
              return cb({
                url: refurl,
                time: vtime
              });
            };
          });
        } else {
          // failed to get a visit entry
          return cb({
            url: refurl
          });
        }
      });
    }
  }

  // listen for message from content script and receive referrer
  chrome.extension.onRequest.addListener(function(request, sender, sendResp) {
    getRefInfo(request.ref, render);
  });

  // inject script into website which returns us document.referrer
  chrome.tabs.executeScript(null, {
    file: "content.js"
  }, function() {});
}
