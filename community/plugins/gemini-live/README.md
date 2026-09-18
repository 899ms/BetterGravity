# Gemini Live Plugin

Real-time voice and multimodal interaction experience for Google Antigravity, modeled after Codex app's live model architecture.

## How it Works

1. **Live Voice Model**:
   - Connects directly to the Gemini Live bidirectional WebSocket API.
   - Provides low-latency audio streaming (16kHz audio input, 24kHz audio output).
   - Voice activity detection with instant interruption handling.

2. **Coding Agent Handoff**:
   - Modeled after Codex app's live model workflow.
   - The Live model acts as a real-time conversational partner with awareness of your active workspace and recent conversation turns.
   - When you speak a coding request (e.g., *"Can you write a unit test for this service?"* or *"Fix the layout bug in the header"*), the Live model calls the `send_coding_prompt` function.
   - The plugin populates the prompt into Antigravity's composer and automatically triggers submission so the Antigravity coding model takes over and performs the actual file edits and tasks.
   - The Live model verbally acknowledges the dispatch in speech.

3. **Live Voice Button Placement & Swapping**:
   - The Live voice button seamlessly occupies the position of the send button whenever the prompt box is empty.
   - When you start typing any message, the Live voice button immediately transitions into the standard Send button.
   - When an agent task is actively running, the Stop/Cancel button retains precedence.

4. **Floating Live Visualizer**:
   - Clicking the Live button opens an audio visualizer above the composer.
   - Displays real-time audio waveform animations, live speech transcripts, mic mute/unmute control, and session disconnect.

## Settings

In BetterGravity Settings (`Ctrl+Shift+G` or Settings cog > Plugins > Gemini Live):

- **Gemini API Key**: Your Google AI Studio Gemini API key.
- **Live Model**:
  - `Gemini 3.8 Flash Live`: Fast, low-latency live audio model.
  - `Gemini 3.8 Flash Live Extended`: Live audio model with extended thinking and deeper context.
- **Voice**: Choose between Puck, Charon, Kore, Fenrir, and Aoede.
