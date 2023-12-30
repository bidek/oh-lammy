class OllamaClient {
    DEFAULT_URL_BASE = "http://localhost:11434"
    GENERATE_URL_ENDPOINT = "/api/generate"
    MODEL_LIST_URL_ENDPOINT = "/api/tags"

    constructor(url = this.DEFAULT_URL_BASE) {
        this.url = url;
    }

    getModelList(callback) {
        let modelUrl = this.url + this.MODEL_LIST_URL_ENDPOINT;
        fetch(modelUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ollama server respond with != 200 response')
                }
                return response.json()
            })
            .then(data => {
                callback(null, data.models);
            })
            .catch(error => {
                callback(error.message + " " + this.url, null);
            })
    }

    callGenerate(model, text, callback) {
        let generateURL = this.url + this.GENERATE_URL_ENDPOINT;
        return fetch(generateURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                prompt: text
            })
        }).then(async response => {
            await this.parseGenerateResponse(response, parsedResponse => {
                let word = parsedResponse.response
                if (word !== undefined) {
                    callback(word)
                }
            })
        }).catch(error => {
            console.log(error)
        })


    }

    async parseGenerateResponse(response, callback) {
        const reader = response.body.getReader()
        let partialLine = ''

        while (true) {
            const {done, value} = await reader.read()
            if (done) {
                break
            }

            // Decode the received value and split by lines
            const textChunk = new TextDecoder().decode(value)
            const lines = (partialLine + textChunk).split('\n')
            partialLine = lines.pop() // The last line might be incomplete

            for (const line of lines) {
                if (line.trim() === '') continue
                const parsedResponse = JSON.parse(line)
                callback(parsedResponse) // Process each response word
            }
        }

        // Handle any remaining line
        if (partialLine.trim() !== '') {
            const parsedResponse = JSON.parse(partialLine)
            callback(parsedResponse)
        }
    }
}

