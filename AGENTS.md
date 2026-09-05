# AI Assistant Documentation Guide: shadcn/ui

This project uses **shadcn/ui** with **Tailwind CSS v4** and **React 19**.

When building UI components, modifying styles, or implementing design patterns, AI assistants should reference the official shadcn/ui LLMs documentation URLs:

## Documentation Index URLs

- **Core Documentation Index**: https://ui.shadcn.com/llms.txt
- **Component Documentation**: https://ui.shadcn.com/docs/components
- **Tailwind CSS v4 Support**: https://ui.shadcn.com/docs/tailwind-v4
- **React 19 Support**: https://ui.shadcn.com/docs/react-19

## Key Architectural Principles

1. **Tailwind CSS v4**:
   - Styles are loaded via `@import "tailwindcss";`, `@import "tw-animate-css";`, and `@import "shadcn/tailwind.css";` in `src/index.css`.
   - The `@tailwindcss/vite` plugin is configured in `vite.config.ts`.
2. **Component Primitives**:
   - Components are built using Radix UI primitives and utility classes (`cn` with `clsx` and `tailwind-merge`).
   - Located under `src/components/ui/` with path alias `@/components/ui/*`.
3. **No Root Provider Required**:
   - shadcn/ui components are modular and open-code.
4. **Imports**:
   - UI components are imported from `@/components/ui/<component-name>`.
   - Utility functions are imported from `@/lib/utils`.
