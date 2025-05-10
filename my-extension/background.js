let result = "unknown";  // TODO: cheack if muli-tab need to save them..

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.action === "pageData") {
        const url = message.url;
        const htmlFeatures = message.htmlFeatures;

        result = runPhishingModel(url, htmlFeatures);

        //Send result to popup
        chrome.runtime.sendMessage({
            action: "modelResult",
            result: result
        });
    }
});

// TODO: run the models
function runPhishingModel(url, htmlFeatures) {
    if (url.length < 20) {
        return "phishing";
    }
    return "safe";
}
