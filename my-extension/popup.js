document.addEventListener("DOMContentLoaded", () => {
    const statusDiv = document.getElementById("status");
    const statusImage = document.getElementById("statusImage");

    // Ask background for the result when popup opens
    chrome.runtime.sendMessage({ action: "getPageStatus" }, (response) => {
        if (response && response.result) 
            {
            if (response.result === "phishing") 
            {
                statusDiv.textContent = "PHISHING DETECTED";
                statusDiv.style.color = "red";
                statusImage.src = "icons/phishing.png";
                statusImage.style.display = "block";
            } 
            else if (response.result === "safe") 
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
        else 
        {
            statusDiv.textContent = "No response";
            statusImage.style.display = "none";
        }
    });
});
