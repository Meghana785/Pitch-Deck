import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))
import google.generativeai as genai

genai.configure(api_key=os.environ["GEMINI_API"])
for m in genai.list_models():
  if 'generateContent' in m.supported_generation_methods:
    print(m.name)
