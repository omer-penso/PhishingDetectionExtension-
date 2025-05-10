(function() {
    //extract URL
    const pageURL = window.location.href;

    //extract HTML features
    const htmlFeatures = {
        numForms: document.querySelectorAll('form').length,
        numLinks: document.querySelectorAll('a').length
    };

    //send to background.js
    chrome.runtime.sendMessage({
        action: "pageData",
        url: pageURL,
        htmlFeatures
    });
})();