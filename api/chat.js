import OpenAI from "openai";

const openai = new OpenAI({
apiKey: process.env.OPENAI_API_KEY
});

async function askGemini(prompt) {
const response = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
{
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
contents: [
{
parts: [
{
text: prompt
}
]
}
]
})
}
);

```
const data = await response.json();

if (!response.ok) {
    throw new Error(
        data.error?.message || "Error en Gemini."
    );
}

const text =
    data.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("") || "";

if (!text) {
    throw new Error("Gemini no devolvió texto.");
}

return text;
```

}

async function askOpenAI(prompt) {
const response = await openai.responses.create({
model: process.env.OPENAI_MODEL,
input: prompt
});

```
if (!response.output_text) {
    throw new Error("OpenAI no devolvió texto.");
}

return response.output_text;
```

}

async function askMistral(prompt) {
const response = await fetch(
"https://api.mistral.ai/v1/chat/completions",
{
method: "POST",
headers: {
"Content-Type": "application/json",
"Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`
},
body: JSON.stringify({
model: process.env.MISTRAL_MODEL,
messages: [
{
role: "user",
content: prompt
}
]
})
}
);

```
const data = await response.json();

if (!response.ok) {
    throw new Error(
        data.error?.message || "Error en Mistral."
    );
}

const text =
    data.choices?.[0]?.message?.content || "";

if (!text) {
    throw new Error("Mistral no devolvió texto.");
}

return text;
```

}

async function askGroq(prompt) {
const response = await fetch(
"https://api.groq.com/openai/v1/chat/completions",
{
method: "POST",
headers: {
"Content-Type": "application/json",
"Authorization": `Bearer ${process.env.GROQ_API_KEY}`
},
body: JSON.stringify({
model: process.env.GROQ_MODEL,
messages: [
{
role: "user",
content: prompt
}
]
})
}
);

```
const data = await response.json();

if (!response.ok) {
    throw new Error(
        data.error?.message || "Error en Groq."
    );
}

const text =
    data.choices?.[0]?.message?.content || "";

if (!text) {
    throw new Error("Groq no devolvió texto.");
}

return text;
```

}

export default async function handler(req, res) {

```
if (req.method !== "POST") {
    return res.status(405).json({
        error: "Método no permitido."
    });
}

const prompt = req.body?.prompt;

if (
    typeof prompt !== "string" ||
    !prompt.trim()
) {
    return res.status(400).json({
        error: "El prompt está vacío."
    });
}

if (prompt.length > 10000) {
    return res.status(400).json({
        error: "El prompt es demasiado largo."
    });
}

const results = await Promise.allSettled([
    askGemini(prompt),
    askOpenAI(prompt),
    askMistral(prompt),
    askGroq(prompt)
]);

const names = [
    "gemini",
    "chatgpt",
    "mistral",
    "groq"
];

const responses = {};

results.forEach((result, index) => {

    const name = names[index];

    if (result.status === "fulfilled") {
        responses[name] = {
            success: true,
            text: result.value
        };
    } else {
        responses[name] = {
            success: false,
            text:
                result.reason?.message ||
                "La IA devolvió un error."
        };
    }
});

return res.status(200).json({
    prompt: prompt,
    responses: responses
});
```

}
