# AI Assistant Documentation Guide: HeroUI v3

This project uses **HeroUI v3** with **Tailwind CSS v4** and **React 19**.

When building UI components, modifying styles, or implementing design patterns, AI assistants should reference the official HeroUI LLMs documentation URLs:

## Documentation Index URLs

- **Core Documentation Index**: https://heroui.com/react/llms.txt
- **Component-Specific Documentation**: https://heroui.com/react/llms-components.txt
- **Patterns and Best Practices**: https://heroui.com/react/llms-patterns.txt
- **Full React Documentation**: https://heroui.com/react/llms-full.txt

## Key Architectural Principles

1. **Tailwind CSS v4**:
   - Styles are loaded via `@import "tailwindcss";` followed by `@import "@heroui/styles";` in `src/index.css`.
   - The `@tailwindcss/vite` plugin is configured in `vite.config.ts`.
2. **React Aria Foundation**:
   - Components are built on React Aria Components for accessibility and keyboard interactions.
   - Interactive components use `onPress` rather than `onClick` (e.g., `<Button onPress={handleAction}>`).
3. **No Root Provider Required**:
   - HeroUI v3 does not require a root `<HeroUIProvider>` wrapper. Components work out of the box once styles are imported.
4. **Imports**:
   - All components are exported from `@heroui/react`.
   - Component styles and theme variables are provided by `@heroui/styles`.
