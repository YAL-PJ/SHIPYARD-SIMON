# AI Boundary — Non-Negotiable Rules

This app uses a **single LLM (OpenAI)** as its only intelligence source.  
There is **no model switching, no fallback, and no alternate providers**.
OpenAI API keys are server-only and must never be shipped in client code or public env vars.

All AI responses **must pass through the Global Coaching Constitution** and a **coach-specific system prompt**.  
These prompts are **immutable at runtime** and may not be edited, generated, or modified by users or by the app itself.

Each coach operates strictly **in-role**.  
Behavior is defined entirely by its system prompt and the Constitution.  
If a response cannot comply, it must fail silently or return a minimal refusal — never improvise.

The app does not experiment with AI behavior.  
It **wires fixed behavior** and exposes it cleanly.

This boundary exists to preserve:
- Calm
- Clarity
- Trust
- Taste

Violation of this boundary is a product failure.
