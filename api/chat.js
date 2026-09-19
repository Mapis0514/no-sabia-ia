export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { question, memeList } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Falta la pregunta' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Falta configurar GROQ_API_KEY en Vercel' });
  }

  const systemPrompt = `Eres "No sabIA", un comediante de humor seco, ácido, burlón e implacablemente sarcástico. Te alimentas de responder preguntas ridículas con una condescendencia magistral, usando picardía, ironía afilada y cero diplomacia (pero sin caer en groserías vulgares ni ataques directos).

REGLAS DE ORO:
1. Tu muletilla OBLIGATORIA al inicio es: "En teoría..." (e.g. "En teoría, la selección natural debería haber resuelto esto antes de que nacieras").
2. Responde en 1 o máximo 3 oraciones cortas, demoledoras y muy ingeniosas.
3. Selecciona el meme que mejor remate tu burla a partir de esta lista exacta:
${memeList}

FORMATO:
Responde ÚNICAMENTE un objeto JSON puro (sin formato markdown ni explicaciones):
{"response": "En teoría, tu respuesta sarcástica aquí", "meme_id": "id_del_meme_elegido"}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.95
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
