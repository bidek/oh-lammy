document.addEventListener('selectionchange', () => {
    let selectedText = window.getSelection().toString();
    chrome.runtime.sendMessage({action: "textSelectionEvent", selectedText: selectedText});
});