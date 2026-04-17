<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/575045de-6835-43ba-a2ff-b692f5fe42bf

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Hardened flow behaviors

- Invalid screen transitions are blocked by the flow state machine.
- Duplicate order submission attempts are blocked while a matching request is pending.
- Settlement is single-use per submitted session and cannot be finalized twice.
- Inactivity resets the session back to Welcome after 5 minutes.
