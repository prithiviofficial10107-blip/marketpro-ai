import os
import openai
from backend.config import Config

class OpenRouterClient:
    def __init__(self):
        self.api_key = Config.OPENROUTER_API_KEY
        self.base_url = Config.OPENROUTER_API_BASE
        self.model = Config.OPENROUTER_MODEL

        if self.api_key:
            self.client = openai.OpenAI(
                api_key=self.api_key,
                base_url=self.base_url,
                default_headers={
                    "HTTP-Referer": "http://localhost:5173",
                    "X-Title": "Asset Management ERP"
                }
            )
        else:
            self.client = None

    def get_completion(self, messages, temperature=0.7, max_tokens=1000):
        if not self.client:
            return "AI Client not configured. Please set OPENROUTER_API_KEY."

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"AI Error: {str(e)}"
