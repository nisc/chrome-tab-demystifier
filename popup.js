function infect() {
  var dateElem = document.getElementById("dateDiv");
  var contentElem = document.getElementById("content");
  var linkElem = document.getElementById("link");
  var errorElem = document.getElementById("error");

  // fallback if not all information could be fetched, for some reason
  function fallback(referrer) {
      linkElem.innerHTML = referrer;
      linkElem.title = referrer;
      linkElem.href = referrer;
      errorElem.style.display = "none";
      contentElem.style.display = "block";
  }

  // listen for message from content script and receive referrer
  chrome.extension.onRequest.addListener(function(request, sender, sendResp) {
    var referrer = request.ref;

    if(referrer) {
      chrome.history.getVisits({url: referrer}, function(vitems) {
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
              // set link title and URL
              linkElem.innerHTML = hitems[0].title || hitems[0].url;
              linkElem.title = hitems[0].url;
              linkElem.href = hitems[0].url;

              // get date object from epoch timestamp
              var time = new Date(hitems[0].lastVisitTime);
              dateElem.innerHTML = "Last visited: <span>" +
                time.toLocaleTimeString() + "</span> (" +
                time.toLocaleDateString() + ")";

              // show content, hide error
              errorElem.style.display = "none";
              contentElem.style.display = "block";

            } else {
              // failed to get a history item
              fallback(referrer);
            };
          });
        } else {
          // failed to get a visit entry
          fallback(referrer);
        }
      });
    }
  });

  // inject script into website which returns us document.referrer
  chrome.tabs.executeScript(null, {
    code: "chrome.extension.sendRequest({ref: document.referrer}, function(response) {})"
  }, function() {});
}
