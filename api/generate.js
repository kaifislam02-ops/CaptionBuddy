export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { type, prompt, image, businessType } = req.body;

    // Determine payload based on request type
    let model, messages;

    if (type === "analyze_image") {
        if (!image || !businessType) {
            return res.status(400).json({ error: 'Image and Business Type are required for analysis' });
        }
        
        model = "meta-llama/llama-4-scout-17b-16e-instruct";
        messages = [
            {
                role: "user",
                content: [
                    {
                        type: "image_url",
                        image_url: {
                            // The frontend sends the full data:image/... base64 string
                            url: image 
                        }
                    },
                    {
                        type: "text",
                        text: `You are a social media assistant for a ${businessType}. Look at this image and describe what you see in 1-2 sentences, focusing on what would be relevant for creating social media content. Be specific about the product, food, service or item shown.`
                    }
                ]
            }
        ];
    } else {
        // Default to standard generation ("generate")
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        model = "llama-3.3-70b-versatile";
        messages = [
            { role: "system", content: "You are a helpful assistant for Indian small business owners. You write catchy, local-style marketing content." },
            { role: "user", content: prompt }
        ];
    }

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: 0.8
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("Groq API Error:", data.error);
            return res.status(500).json({ error: data.error.message });
        }

        const result = data.choices[0].message.content;
        return res.status(200).json({ result });

    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ error: 'Failed to connect to Groq API' });
    }
}
