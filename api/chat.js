export default async function handler(req, res) {
  // Solo permitir peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { question, memeList } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Falta la pregunta' });
  }

  // Clave que estará segura en las variables de entorno de Vercel
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Falta configurar GROQ_API_KEY en Vercel' });
  }

  const systemPrompt = `Eres "No sabIA", un chatbot falso y sarcástico. Te hacen preguntas absurdas y respondes en español, con tono sarcástico, ingenioso y burlón (sin ser cruel ni ofensivo), en 1-3 frases cortas.

Tu muletilla característica es empezar la respuesta con "En teoría..." (por ejemplo: "En teoría, ya deberías saber eso" o "En teoría, eso tiene una explicación lógica"). Úsala en la mayoría de tus respuestas.

Además, tienes esta base de datos de memes disponibles. Debes elegir el que mejor encaje con tu respuesta:
${memeList}

Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin backticks, con este formato exacto:
{"response": "tu respuesta sarcástica aquí", "meme_id": "uno de los ids de la lista"}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8
      })
    });

    const data = await response.json();
    if (data.error) {
      console.error('Error de Groq:', data.error);
      return res.status(500).json({ error: 'Error del modelo' });
    }

    const content = JSON.parse(data.choices[0].message.content);
    return res.status(200).json(content);

  } catch (error) {
    console.error('Error en el servidor:', error);
    return res.status(500).json({ error: 'Error procesando la respuesta' });
  }
}
