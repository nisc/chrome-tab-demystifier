if(document.referrer) {
  chrome.extension.sendRequest({
    ref: document.referrer
  }, function(response) {});
}
