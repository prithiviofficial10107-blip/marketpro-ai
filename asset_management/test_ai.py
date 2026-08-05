import os
from dotenv import load_dotenv
import openai

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
api_base = os.getenv("OPENAI_API_BASE", "https://openrouter.ai/api/v1")
model = os.getenv("OPENAI_MODEL", "google/gemma-3-12b-it:free")

print(f"Key: {api_key[:10]}...")
print(f"Base: {api_base}")
print(f"Model: {model}")

client = openai.OpenAI(
    api_key=api_key,
    base_url=api_base
)

try:
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": "Hi, are you working?"}]
    )
    print("AI Response:", response.choices[0].message.content)
except Exception as e:
    print("AI Error:", str(e))
