import OpenAI from "openai";

const openai = new OpenAI({
apiKey: process.env.OPENAI_API_KEY
});

const gemini = new OpenAI({
apiKey: process.env.GEMINI_API_KEY,
baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

async function askGemini(prompt) {
const response = await gemini.chat.completions.create({
model: "gemini-3.8-flash",
messages: [
{
role: "user",
content: prompt
}
]
});


const text =
    response.choices?.[0]?.message?.content || "";

if (!text) {
    throw new Error("Gemini no devolvió texto.");
}

return text;


}

async function askOpenAI(prompt) {
const response = await openai.responses.create({
model: "gpt-5-mini",
input: prompt
});


if (!response.output_text) {
    throw new Error("OpenAI no devolvió texto.");
}

return response.output_text;


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
model: "mistral-small-2603",
messages: [
{
role: "user",
content: prompt
}
]
})
}
);


const data = await response.json();

console.log("MISTRAL STATUS:", response.status);
console.log("MISTRAL DATA:", data);

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
model: "openai/gpt-oss-120b",
messages: [
{
role: "user",
content: prompt
}
]
})
}
);


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


}

export default async function handler(req, res) {

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

}
