let result = "unknown";  // TODO: cheack if muli-tab or one-tab

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "pageData") {
        const url = message.url;
        const htmlFeatures = message.htmlFeatures;

        result = runPhishingModel(url, htmlFeatures);
    }

    if (message.action === "getPageStatus") {
        sendResponse({ result });
    }
});

// TODO: run the models
function runPhishingModel(url, htmlFeatures) {
    if (url.length < 40) {
        return "safe";
    }
    return "phishing";
}
