document.addEventListener("DOMContentLoaded", () => {
    const statusDiv = document.getElementById("status");
    const statusImage = document.getElementById("statusImage");

    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === "modelResult") {
            if (message.result === "phishing") 
            {
                statusDiv.textContent = "PHISHING DETECTED";
                statusDiv.style.color = "red";
                statusImage.src = "icons/phishing.png";
                statusImage.style.display = "block";
            } 
            else if (message.result === "safe") 
            {
                statusDiv.textContent = "Page is Safe";
                statusDiv.style.color = "green";
                statusImage.src = "icons/safe.png";
                statusImage.style.display = "block";
            } 
            else 
            {
                statusDiv.textContent = "Unknown";
                statusImage.style.display = "none";
            }
        }
    });
});
