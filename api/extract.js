export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { base64Pdf, folderName } = req.body

  if (!base64Pdf) {
    return res.status(400).json({ error: 'No PDF data provided' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64Pdf,
              },
            },
            {
              type: 'text',
              text: `Extract the following information from this mortgage document and return ONLY a valid JSON object with no markdown, no backticks, no explanation:
{
  "name": "full name of applicant or null",
  "phone": "phone number as string or null",
  "address": "full address or null",
  "income": "annual income as string like $65,000 or null",
  "credit_score": 650,
  "loan_amount": "loan amount as string like $380,000 or null",
  "app_date": "date in YYYY-MM-DD format or null",
  "outcome": "one of: preapproval, denied, closed, incomplete, unknown",
  "denial_reason": "reason if denied, otherwise null",
  "spanish": true or false
}

Rules:
- outcome: preapproval = preapproval letter with no closing docs, denied = denial letter found, closed = closing/HUD/settlement docs found, incomplete = incomplete application, unknown = cannot determine
- spanish: true if Spanish surname OR document contains Spanish text
- credit_score must be a number or null, not a string
- If field not found use null
- Return ONLY the JSON object, nothing else`,
            },
          ],
        }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return res.status(500).json({ error: `Anthropic error: ${err}` })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || '{}'

    try {
      const parsed = JSON.parse(text.trim())
      return res.status(200).json(parsed)
    } catch {
      // Try to extract JSON from the response
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        return res.status(200).json(parsed)
      }
      return res.status(200).json({ outcome: 'unknown', spanish: false })
    }

  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
