// const port = chrome.runtime.connect({ name: "settings" });
document.addEventListener('DOMContentLoaded', (domContentLoadedEvent) => {
    let promptTable = document.getElementById('promptTable')
    let tbody = promptTable.getElementsByTagName("tbody")[0]
    let savePromptButton = document.getElementById('saveButton')
    let refreshModelsButton = document.getElementById('refreshModelsButton')
    let modelSelect = document.getElementById("modelSelect")
    let errorsDiv = document.getElementById("error")
    let ollamaURL = document.getElementById("ollamaURL")

    errorsDiv.style.display = "none";

    // load saved config
    chrome.storage.sync.get().then(function (result) {
        // Update the input field with the retrieved setting
        renderTable(tbody, result.prompts);
        renderSelectModels(modelSelect, result.models);
        renderURL(ollamaURL, result.ollamaURL)
        selectCurrentConfiguredModel(modelSelect, result.selectedModel)
        showHidePromptsDiv(result)
    });

    // register events handlers
    savePromptButton.addEventListener("click", onAddPromptClick);
    refreshModelsButton.addEventListener("click", onRefreshButtonClick);
    modelSelect.addEventListener("change", onModelSelect);
    ollamaURL.addEventListener("input", (e) => {
        chrome.storage.sync.set({ollamaURL: e.target.value});
    });
});

function onModelSelect(e) {
    chrome.storage.sync.set({selectedModel: e.target.value});
}

function onAddPromptClick() {
    const promptValue = document.getElementById("promptInput").value;
    savePrompt(promptValue);
    location.reload();
}

function onRefreshButtonClick() {
    // port.postMessage({ action: "modelRefresh" });

    chrome.runtime.sendMessage({action: "modelRefresh"}, (response) => {
        if (response.error) {
            showErrors(response.error);
            chrome.storage.sync.set({models: []});          // cant refresh models, cleaning old one, something is not right ;)
        } else {
            let newModels = []
            response.models.forEach((ollamaModel) => {
                newModels.push({name: ollamaModel.name});
            })
            chrome.storage.sync.set({models: newModels});
            location.reload()
        }
    });
}

function showErrors(error) {
    let errorDiv = document.getElementById("error")
    let errorMessage = document.getElementById("errorMessage")

    errorDiv.style.display = "block";

    errorMessage.innerText = error;
}

function showHidePromptsDiv(extensionConfig) {

    let emptyPromptsDiv = document.getElementById("empty-prompt-list")
    let promptsDiv = document.getElementById("prompt-list")

    if (extensionConfig.prompts.length > 0) {
        emptyPromptsDiv.style.display = "none";
        promptsDiv.style.display = "block";
    } else {
        emptyPromptsDiv.style.display = "block";
        promptsDiv.style.display = "none";
    }
}

function renderURL(input, url) {
    input.value = url
}

function renderSelectModels(select, models) {
    models.forEach(m => {
        let option = document.createElement('option');

        document.createElement("option");
        option.text = m.name;
        option.value = m.name;
        select.add(option)
    })
}

function renderTable(tableBody, prompts) {
    tableBody.innerHTML = "";

    for (let i = 0; i < prompts.length; i++) {
        let prompt = prompts[i]['name'];

        const row = tableBody.insertRow(i);

        const cell1 = row.insertCell(0);
        const cell2 = row.insertCell(1);
        const buttonGroup = document.createElement('div');
        const button = document.createElement('button');

        button.innerText = "x";
        button.onclick = function () {
            removePrompt({name: prompt});
        }
        button.className = 'btn btn-sm btn-danger'
        buttonGroup.append(button)
        buttonGroup.className = "btn-group"
        buttonGroup.role = "group"

        cell1.innerText = prompt;
        cell2.append(buttonGroup);
        cell2.className = "text-end";
    }
}

function selectCurrentConfiguredModel(selectElement, model) {
    selectElement.value = model;
}

function removePrompt(prompt) {
    chrome.storage.sync.get().then(function (result) {
        let prompts = result.prompts;

        let filteredPrompts = prompts.filter(promptInStore => promptInStore.name !== prompt.name);

        chrome.storage.sync.set({prompts: filteredPrompts});
        location.reload();
    });
}


function savePrompt(prompt) {
    chrome.storage.sync.get().then(function (result) {
        let prompts = result.prompts;

        prompts.push({name: prompt});
        chrome.storage.sync.set({prompts: prompts});
    });
}

