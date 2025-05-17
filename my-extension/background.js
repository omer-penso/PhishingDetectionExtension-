import { extractFeatures } from './featureExtractor.js';
import { score } from './rf_shallow.js';

let result = "unknown";  // TODO: cheack if muli-tab or one-tab

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "pageData") {
        console.log("logging: Detected pageData message");

        const url = message.url;
        //const htmlFeatures = message.htmlFeatures;predictRF

        console.log("logging: URL received:", url);

        result = runURLModel(url);
    }

    if (message.action === "getPageStatus") {
        console.log("logging: Popup requested status → sending:", result);
        sendResponse({ result });
    }
});

function runURLModel(url) {
    const features = extractFeatures(url);
    console.log("logging: URL features extracted:", features);
    if (!features) return "unknown";   // in case url is invalid

    const result = score(features);
    console.log("logging: FINAL RESULT:", result);
    // result = [safe_probability, phishing_probability]
    return result[0] > 0.45 ? "phising" : "safe";
}
