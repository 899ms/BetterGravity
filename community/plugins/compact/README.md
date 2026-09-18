# Compact

Trigger Antigravity's native conversation compaction on demand via a dedicated `/compact` slash command.

## Features

- **Native Compaction Engine**: Invokes the built-in language server compaction hook directly (`google3/third_party/gemini_coder/framework/core/hooks/hooks.NewContextSummaryHook` and `manualCompactionRequested`), producing true context compaction rather than an artificial prompt summary.
- **Strict Slash Menu Isolation**:
  - When the prompt box is empty and you type `/`, **only** the `compact` command is shown in the slash menu.
  - If any text has already been entered into the prompt box, `compact` is automatically hidden and disabled.
- **Immediate Auto-Send**:
  - Selecting `compact` (via mouse click, Enter, or Tab) immediately dispatches the command to Antigravity without requiring an additional Enter press.
  - The editor is automatically cleared and unfocused to prevent subsequent typing.
- **Zero Configuration**: Activates the internal `enable-compact-slash-command` experiment flag automatically via runtime flag synchronization.
