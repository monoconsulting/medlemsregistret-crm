export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIProvider {
  name: string
  chat(messages: ChatMessage[]): Promise<string>
}

class OpenAIProvider implements AIProvider {
  name = 'openai'

  constructor(private readonly apiKey: string, private readonly model: string) {}

  async chat(messages: ChatMessage[]): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model || 'gpt-4o-mini',
        messages,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI error: ${await response.text()}`)
    }

    const data = (await response.json()) as any
    const content = data.choices?.[0]?.message?.content

    if (Array.isArray(content)) {
      return content.map((item: any) => item.text ?? item).join('\n')
    }

    return content ?? ''
  }
}

class AnthropicProvider implements AIProvider {
  name = 'anthropic'

  constructor(private readonly apiKey: string, private readonly model: string) {}

  async chat(messages: ChatMessage[]): Promise<string> {
    const system = messages.find((msg) => msg.role === 'system')?.content ?? ''
    const userMessages = messages.filter((msg) => msg.role !== 'system')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model || 'claude-3-haiku-20240307',
        system,
        messages: userMessages.map((msg) => ({ role: msg.role, content: msg.content })),
        max_tokens: 800,
      }),
    })

    if (!response.ok) {
      throw new Error(`Anthropic error: ${await response.text()}`)
    }

    const data = (await response.json()) as any
    return data.content?.map((chunk: any) => chunk.text ?? '').join('\n') ?? ''
  }
}

class OllamaProvider implements AIProvider {
  name = 'ollama'

  constructor(private readonly host: string, private readonly model: string) {}

  async chat(messages: ChatMessage[]): Promise<string> {
    const response = await fetch(`${this.host.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model || 'llama3',
        messages,
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama error: ${await response.text()}`)
    }

    const data = (await response.json()) as any
    return data.message?.content ?? ''
  }
}

let cachedProvider: AIProvider | null | undefined

export function getAIProvider(): AIProvider | null {
  if (cachedProvider !== undefined) {
    return cachedProvider
  }

  const provider = process.env.AI_PROVIDER?.toLowerCase()

  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY
    const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
    if (!apiKey) {
      console.warn('OpenAI configured without API key')
      cachedProvider = null
      return cachedProvider
    }
    cachedProvider = new OpenAIProvider(apiKey, model)
    return cachedProvider
  }

  if (provider === 'anthropic') {
    const apiKey = process.env.ANTHROPIC_API_KEY
    const model = process.env.ANTHROPIC_MODEL ?? 'claude-3-haiku-20240307'
    if (!apiKey) {
      console.warn('Anthropic configured without API key')
      cachedProvider = null
      return cachedProvider
    }
    cachedProvider = new AnthropicProvider(apiKey, model)
    return cachedProvider
  }

  if (provider === 'ollama') {
    const host = process.env.OLLAMA_HOST ?? 'http://localhost:11434'
    const model = process.env.OLLAMA_MODEL ?? 'llama3'
    cachedProvider = new OllamaProvider(host, model)
    return cachedProvider
  }

  cachedProvider = null
  return cachedProvider
}
