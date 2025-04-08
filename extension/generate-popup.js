const span = document.getElementById("explanationSpan")
const title = document.getElementById("title")
const selection = document.getElementById("selection")
const spinner = () => document.getElementById("spinner")
const saveMarkdownBtn = document.getElementById("saveMarkdownBtn")

let contentBeforeParsing = ""
let markdown = ""

// Initially disable the save button until content is available
saveMarkdownBtn.disabled = true

// Function to save markdown content to a file
function saveMarkdownToFile() {
    if (!contentBeforeParsing) {
        console.error("No content to save");
        return;
    }

    // Create a blob with the markdown content
    const blob = new Blob([contentBeforeParsing], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);

    // Generate filename based on the prompt title
    const promptText = title.innerText || "explanation";
    const filename = promptText.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30) + '.md';

    // Use the chrome.downloads API to download the file
    chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: true
    }, (downloadId) => {
        if (chrome.runtime.lastError) {
            console.error("Download failed:", chrome.runtime.lastError);
        }
        // Clean up the blob URL
        URL.revokeObjectURL(url);
    });
}

// Add event listener to the save button
saveMarkdownBtn.addEventListener('click', saveMarkdownToFile);
chrome.runtime.onMessage.addListener((message) => {
        if (message.type === "stream") {

            spinner().style.display = 'none';

            title.innerText = message.prompt
            selection.innerText = message.selection


            contentBeforeParsing += message.data;
            markdown = marked.parse(contentBeforeParsing)
            span.innerHTML = markdown

            // Enable the save button once streaming is over
            if (message.isDone) {
                saveMarkdownBtn.disabled = false;
            }
        } else {
            console.error("unsupported message type " + message.type)
        }
    }
)
