document.addEventListener("DOMContentLoaded", () => {

```
const form = document.getElementById("prompt-form");
const promptInput = document.getElementById("prompt");
const sendButton = document.getElementById("send-button");

const panels = {
    gemini: document.querySelector("#gemini .ai-content"),
    chatgpt: document.querySelector("#chatgpt .ai-content"),
    mistral: document.querySelector("#mistral .ai-content"),
    groq: document.querySelector("#groq .ai-content")
};

if (!form || !promptInput || !sendButton) {
    console.error("No se encontraron los elementos principales del formulario.");
    return;
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const prompt = promptInput.value.trim();

    if (!prompt) {
        promptInput.focus();
        return;
    }

    setLoading(true);
    showThinking();

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                prompt: prompt
            })
        });

        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error("El servidor no devolvió una respuesta válida.");
        }

        if (!response.ok) {
            throw new Error(
                data.error || "Error al comunicarse con el servidor."
            );
        }

        if (!data.responses) {
            throw new Error("El servidor no devolvió las respuestas de las IAs.");
        }

        showAllResponses(data.responses);

    } catch (error) {
        console.error("Error:", error);
        showGlobalError(error.message);
    } finally {
        setLoading(false);
        promptInput.focus();
    }
});

function showThinking() {
    Object.values(panels).forEach(panel => {
        if (!panel) return;

        panel.classList.remove("show-response");

        panel.innerHTML = "";

        const thinking = document.createElement("div");
        thinking.className = "thinking-state";

        const text = document.createElement("span");
        text.textContent = "Pensando";

        const dots = document.createElement("span");
        dots.className = "thinking-dots";
        dots.textContent = "...";

        thinking.appendChild(text);
        thinking.appendChild(dots);

        panel.appendChild(thinking);
    });
}

function showAllResponses(responses) {

    Object.entries(panels).forEach(([name, panel]) => {

        if (!panel) return;

        const result = responses[name];

        panel.classList.remove("show-response");
        panel.innerHTML = "";

        const responseElement = document.createElement("div");

        if (result?.success) {
            responseElement.className = "response";
            responseElement.textContent = result.text;
        } else {
            responseElement.className = "error";
            responseElement.textContent =
                result?.text || "Esta IA no pudo responder.";
        }

        panel.appendChild(responseElement);
    });

    requestAnimationFrame(() => {
        Object.values(panels).forEach(panel => {
            if (panel) {
                panel.classList.add("show-response");
            }
        });
    });
}

function showGlobalError(message) {

    Object.values(panels).forEach(panel => {

        if (!panel) return;

        panel.classList.remove("show-response");
        panel.innerHTML = "";

        const error = document.createElement("div");
        error.className = "error";
        error.textContent = message;

        panel.appendChild(error);
    });
}

function setLoading(loading) {
    sendButton.disabled = loading;
    promptInput.disabled = loading;

    if (loading) {
        sendButton.textContent = "Enviando...";
    } else {
        sendButton.textContent = "Enviar";
    }
}

promptInput.addEventListener("keydown", event => {

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {
        event.preventDefault();

        if (!sendButton.disabled) {
            form.requestSubmit();
        }
    }
});
```

});
