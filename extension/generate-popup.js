const span = document.getElementById("explanationSpan")
const title = document.getElementById("title")
const selection = document.getElementById("selection")
const spinner = () => document.getElementById("spinner")

let contentBeforeParsing = ""
let markdown = ""
chrome.runtime.onMessage.addListener((message) => {
        if (message.type === "stream") {

            spinner().style.display = 'none';

            title.innerText = message.prompt
            selection.innerText = message.selection


            contentBeforeParsing += message.data;
            markdown = marked.parse(contentBeforeParsing)
            span.innerHTML = markdown
        } else {
            console.error("unsupported message type " + message.type)
        }
    }
)
