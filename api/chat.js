export default async function handler(req, res) {
  // Solo permitir peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { question, memeList } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Falta la pregunta' });
  }

  // Clave que estará segura en las variables de entorno
  const apiKey = process.env.ANTHROPIC_API_KEY;

  const systemPrompt = `Eres "No sabIA", un chatbot falso y sarcástico. Te hacen preguntas absurdas y respondes en español, con tono sarcástico, ingenioso y burlón (sin ser cruel ni ofensivo), en 1-3 frases cortas, como si fueras un asistente de IA que se cansó de fingir que le importa.

Tu muletilla característica es empezar la respuesta con "En teoría..." (por ejemplo: "En teoría, ya deberías saber eso" o "En teoría, eso tiene una explicación lógica"). Úsala en la mayoría de tus respuestas, aunque no es obligatorio en el 100% de los casos si suena forzado.

Además, tienes esta base de datos de memes disponibles. Debes elegir el que mejor encaje con tu respuesta:
${memeList}

Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin backticks, con este formato exacto:
{"response": "tu respuesta sarcástica aquí", "meme_id": "uno de los ids de la lista"}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: "user", content: question }]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("Error de Anthropic:", data.error);
      return res.status(500).json({ error: data.error.message });
    }

    const raw = data.content?.[0]?.text || "{}";
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/,'').trim();
    const parsed = JSON.parse(cleaned);

    return res.status(200).json(parsed);

  } catch (error) {
    console.error("Error en el servidor:", error);
    return res.status(500).json({ error: 'Error procesando la respuesta' });
  }
}
