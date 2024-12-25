importScripts("extensions-consts.js")
importScripts("ollama.js")

let ollamaClient = new OllamaClient();
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // if (details.reason === 'install' || details.reason === 'update') {
        let defaultConfig = defaultExtensionConfiguration();
        chrome.storage.sync.set(defaultConfig);
        recreateContextMenu(defaultConfig.prompts);
        ollamaClient = new OllamaClient(defaultConfig.ollamaURL);
    }
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action && message.action === "modelRefresh") {
        ollamaClient.getModelList((error, models) => {
            if (error) {
                sendResponse({error: error, models: models})
            } else {
                sendResponse({error: null, models: models})
            }
        });
        return true;
    } else if (message.action && message.action === "textSelectionEvent") {
        chrome.storage.sync.get().then(function (config) {
            // recreate context menu
            if (config.prompts.length > 0) {
                recreateContextMenu(config.prompts);
            } else {
                chrome.contextMenus.removeAll()
            }
        })
        return false;
    }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    chrome.storage.sync.get().then(function (config) {
        recreateContextMenu(config.prompts);
        ollamaClient = new OllamaClient(config.ollamaURL);
    })
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
    let menuItemId = info.menuItemId;
    // only interested in childs menu item clicks
    if (menuItemId !== CONTEXT_MENU_ID) {

        chrome.storage.sync.get().then(function (config) {
            let model = config.selectedModel
            let selection = info.selectionText
            let prompt = info.menuItemId

            if (model && model.length > 0) {
                // let text = prompt + " " + selection;
                let text = prepareText(prompt, selection);

                chrome.windows.create({
                    url: chrome.runtime.getURL('generate-popup.html'),
                    type: 'popup',
                    width: 600,
                    height: 800
                }, function (window) {
                    let popupTabId = window.tabs[0].id

                    ollamaClient.callGenerate(model, text, (data) => {
                        chrome.tabs.sendMessage(popupTabId, {
                            type: "stream",
                            data: data,
                            prompt: prompt,
                            selection: selection
                        });
                    })

                })
            } else {

                let opt = {
                    type: "basic",
                    title: "Configuration error",
                    message: "Choose model",
                    iconUrl: "ollama.png"
                }
                chrome.notifications.create(opt);
            }
        });
    }
});


function prepareText(prompt, selection) {
    let finalText;
    if(prompt.indexOf("[selection]") !== -1) {
        // repleace [selection] with selection
        finalText = prompt.replace("[selection]", selection);
    } else {
        // append selection to prompt
        finalText = prompt + "  " + selection;
    }

    return finalText;
}

function recreateContextMenu(prompts) {
    chrome.contextMenus.removeAll()
    chrome.contextMenus.create({
        "id": CONTEXT_MENU_ID,
        "title": CONTEXT_MENU_TITLE,
        "contexts": ["selection"]
    })
    prompts.forEach(prompt => {
        chrome.contextMenus.create({
            title: prompt.name,
            parentId: CONTEXT_MENU_ID,
            id: prompt.name,
            contexts: ["selection"]
        });
    });
}

function defaultExtensionConfiguration() {
    return {
        "ollamaURL": "http://localhost:11434",          // url to ollama server
        "selectedModel": undefined,                     // model used in ollama api call
        "models": [],                                   // cached models names from ollama api call
        "prompts": [                                    // prompts - what plugin is all about
            {name: "Explain this:"},
            {name: "Summary this:"},
            {name: "Explain like I`m 5:"}
        ]
    }
}