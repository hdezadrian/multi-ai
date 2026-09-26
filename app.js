document.addEventListener("DOMContentLoaded", function () {

// ========================================
// ELEMENTOS DE LA INTERFAZ
// ========================================

const form = document.getElementById("prompt-form");
const promptInput = document.getElementById("prompt");
const sendButton = document.getElementById("send-button");

const panels = {
    gemini: document.querySelector("#gemini .ai-content"),
    chatgpt: document.querySelector("#chatgpt .ai-content"),
    mistral: document.querySelector("#mistral .ai-content"),
    groq: document.querySelector("#groq .ai-content")
};


// ========================================
// COMPROBAR QUE EL HTML ESTÁ CORRECTO
// ========================================

if (!form || !promptInput || !sendButton) {
    console.error("No se han encontrado los elementos principales del formulario.");
    return;
}

for (const name in panels) {
    if (!panels[name]) {
        console.error("No se ha encontrado el panel de " + name);
        return;
    }
}


// ========================================
// ENVIAR PROMPT
// ========================================

form.addEventListener("submit", async function (event) {

    event.preventDefault();

    const prompt = promptInput.value.trim();

    if (!prompt) {
        promptInput.focus();
        return;
    }

    // Bloquear interfaz mientras trabajan las IAs
    setLoading(true);

    // Mostrar "Pensando..." en las cuatro
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


        // ========================================
        // COMPROBAR RESPUESTA DEL SERVIDOR
        // ========================================

        let data;

        try {
            data = await response.json();
        } catch (error) {
            throw new Error(
                "El servidor devolvió una respuesta que no es válida."
            );
        }


        if (!response.ok) {
            throw new Error(
                data.error || "Ha ocurrido un error en el servidor."
            );
        }


        if (!data.responses) {
            throw new Error(
                "El servidor no devolvió las respuestas de las IAs."
            );
        }


        // ========================================
        // MOSTRAR LAS CUATRO RESPUESTAS
        // ========================================

        showAllResponses(data.responses);

    } catch (error) {

        console.error("Error:", error);

        showGlobalError(
            error.message || "No se ha podido conectar con el servidor."
        );

    } finally {

        setLoading(false);

        promptInput.focus();
    }
});


// ========================================
// ESTADO "PENSANDO..."
// ========================================

function showThinking() {

    for (const panel of Object.values(panels)) {

        panel.replaceChildren();

        panel.classList.remove("show-response");
        panel.classList.add("thinking");


        // Contenedor principal
        const thinkingState = document.createElement("div");

        thinkingState.className = "thinking-state";


        // Contenedor de los tres puntos
        const dots = document.createElement("div");

        dots.className = "thinking-dots";


        // Crear puntos
        const dot1 = document.createElement("span");
        const dot2 = document.createElement("span");
        const dot3 = document.createElement("span");


        dots.appendChild(dot1);
        dots.appendChild(dot2);
        dots.appendChild(dot3);


        // Texto
        const text = document.createElement("span");

        text.textContent = "Pensando...";


        // Montar elemento
        thinkingState.appendChild(dots);
        thinkingState.appendChild(text);

        panel.appendChild(thinkingState);
    }
}


// ========================================
// MOSTRAR TODAS LAS RESPUESTAS
// ========================================

function showAllResponses(responses) {

    for (const [name, panel] of Object.entries(panels)) {

        const result = responses[name];


        // Si no existe respuesta
        if (!result) {

            showPanelError(
                panel,
                "Esta IA no devolvió ninguna respuesta."
            );

            continue;
        }


        // Limpiar "Pensando..."
        panel.replaceChildren();

        panel.classList.remove("thinking");


        // ========================================
        // RESPUESTA CORRECTA
        // ========================================

        if (result.success) {

            const responseElement =
                document.createElement("div");

            responseElement.className = "response";

            responseElement.textContent = result.text || "";

            panel.appendChild(responseElement);

        }

        // ========================================
        // ERROR DE UNA IA
        // ========================================

        else {

            showPanelError(
                panel,
                result.text || "Esta IA ha devuelto un error."
            );
        }
    }


    // ========================================
    // REVELAR LAS CUATRO AL MISMO TIEMPO
    // ========================================

    requestAnimationFrame(function () {

        for (const panel of Object.values(panels)) {

            panel.classList.add("show-response");
        }
    });
}


// ========================================
// ERROR EN UN PANEL
// ========================================

function showPanelError(panel, message) {

    panel.replaceChildren();

    panel.classList.remove("thinking");


    const errorElement =
        document.createElement("div");

    errorElement.className = "error";

    errorElement.textContent = message;


    panel.appendChild(errorElement);
}


// ========================================
// ERROR GENERAL
// ========================================

function showGlobalError(message) {

    for (const panel of Object.values(panels)) {

        panel.replaceChildren();

        panel.classList.remove("thinking");


        const errorElement =
            document.createElement("div");

        errorElement.className = "error";

        errorElement.textContent = message;


        panel.appendChild(errorElement);

        panel.classList.add("show-response");
    }
}


// ========================================
// BLOQUEAR / DESBLOQUEAR INTERFAZ
// ========================================

function setLoading(loading) {

    sendButton.disabled = loading;

    promptInput.disabled = loading;


    if (loading) {

        sendButton.textContent = "Pensando...";

    } else {

        sendButton.textContent = "Enviar";
    }
}


// ========================================
// ENTER PARA ENVIAR
// SHIFT + ENTER = NUEVA LÍNEA
// ========================================

promptInput.addEventListener("keydown", function (event) {

    if (event.key === "Enter" && !event.shiftKey) {

        event.preventDefault();

        form.requestSubmit();
    }
});

});
