# Controller Guidelines

- Keep buttons large, clear, and separated.
- Combine interactions with haptics or audio when available and appropriate.
- Do not keep authoritative gameplay logic in the controller.
- Use landscape only when the game genuinely benefits from it.
- Design generous touch targets for smaller displays.
- Prefer explicit input actions over raw gesture interpretation scattered across components.
- Test phone controllers in Chromium-based browsers or Safari first. Firefox can sometimes behave differently around fullscreen, reconnect/session handling, and touch input timing.
