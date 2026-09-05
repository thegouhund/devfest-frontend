---
name: Nadiku
description: Calm, clinical-but-friendly wellness design system for non-invasive family health monitoring
colors:
  primary: "#0E7490"
  primary-dark: "#0F172A"
  primary-light: "#F0FDFA"
  neutral-bg: "#F6F4EE"
  surface: "#FFFFFF"
  border: "#E7E5E4"
  text-primary: "#0F172A"
  text-secondary: "#475569"
  text-muted: "#94A3B8"
  success: "#10B981"
  success-light: "#D1FAE5"
  success-dark: "#064E3B"
  warning: "#D97706"
  warning-light: "#FEF3C7"
  danger: "#EF4444"
  danger-light: "#FEE2E2"
typography:
  display:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.05em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.surface}"
    rounded: "{rounded.full}"
    padding: "10px 28px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.full}"
    padding: "10px 24px"
  card-container:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "32px 48px"
  input-field:
    backgroundColor: "#F9F9F8"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
---

# Design System: Nadiku

## Overview

**Creative North Star: "The Calm Clinical Sanctuary"**

Nadiku avoids both the cold, anxiety-inducing sterile aesthetic of hospital software and the generic look of casual lifestyle apps. It establishes a serene, warm, and highly trustworthy environment where families feel reassured rather than alarmed when monitoring their daily vital signs.

The system is built on tactile, paper-like warmth (`#F6F4EE`), crisp elevated cards (`#FFFFFF`), deep oceanic teal accents (`#0E7490`), obsidian pill controls (`#0F172A`), and soft sage-green indicators (`#D1FAE5`). Data density is balanced with generous whitespace, allowing vital sign numbers, trend curves, and lifestyle logs to breathe.

**Key Characteristics:**
- **Reassurance Over Alarm**: Soft organic tones replace aggressive reds; alerts guide action rather than trigger panic.
- **Tactile Clarity**: Clean rounded containers (12px–24px), subtle hairline borders (`#E7E5E4`), and soft ambient shadows.
- **Uncompromised Contrast**: Deep slate typography (`#0F172A`) ensures critical numbers and health labels remain immediately legible across all ambient lighting conditions.

## Colors

The palette balances warm organic neutrality with precise clinical accents.

### Primary
- **Deep Oceanic Teal** (`#0E7490`): The identity anchor used for brand insignias, active step lines, and focus indicators.
- **Obsidian Dark** (`#0F172A`): The high-contrast anchor used for primary call-to-action pill buttons and high-priority headings.

### Secondary & Status
- **Sage Mint Green** (`#D1FAE5` / `#064E3B`): Normal/healthy vital states, completed steps, and selected option pills.
- **Warm Amber** (`#FEF3C7` / `#B45309`): Non-diagnostic medical disclaimers and mild vital deviations.
- **Soft Coral** (`#FEE2E2` / `#991B1B`): Critical anomaly indicators (used very sparingly, never as decoration).

### Neutral
- **Warm Sand Canvas** (`#F6F4EE`): The tactile base background for all page views.
- **Surface Pure White** (`#FFFFFF`): Elevated container cards and form surfaces.
- **Hairline Stone Border** (`#E7E5E4`): Clean 1px framing boundaries.
- **Deep Slate Text** (`#0F172A`): Primary headings and vital numerals.
- **Muted Slate Text** (`#475569` / `#94A3B8`): Subtitles, helper text, and secondary units.

### Named Rules
**The Rarity of Red Rule.** Coral/red is strictly reserved for high-severity anomaly alerts and hard input validation errors. It is never used for decoration, brand highlights, or standard buttons.

## Typography

**Font Family:** System UI Sans-Serif stack (`system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`).

**Character:** Clean, highly legible, modern sans-serif with tighter scale ratios tailored for both numerical telemetry and friendly Indonesian conversational copy.

### Hierarchy
- **Display** (Bold 700, `1.875rem` / `30px`, line-height `1.2`, tracking `-0.025em`): Step titles, modal headers, major greetings.
- **Headline** (Bold 700, `1.5rem` / `24px`, line-height `1.25`, tracking `-0.02em`): Section headings, card titles.
- **Title / Vitals** (Semi-bold 600, `1rem` / `16px` to `2.25rem` for BPM values): Vital sign numbers and prominent labels.
- **Body** (Regular 400, `0.875rem` / `14px`, line-height `1.5`): General descriptive text, explanation paragraphs.
- **Label** (Bold 700, `0.75rem` / `12px`, uppercase, tracking `0.05em`): Form field labels, status badges, metric units.

## Layout

The spatial model relies on centered container topology with structural responsiveness:
- **Max Widths**: Forms and cards center on a constrained width (`max-w-3xl` / 768px for onboarding, `max-w-5xl` / 1024px for dashboards).
- **Padding Rhythm**: Step cards feature generous padding (`p-6` mobile, `p-12` desktop) to create a relaxed, uncluttered atmosphere.
- **Structural Grids**: Steppers and metric cards use strict CSS grid layouts (e.g. `grid-cols-4`, `grid-cols-3`) with mathematically aligned connecting lines.

## Elevation & Depth

Nadiku uses a hybrid of tonal layering and soft ambient drop shadows:
- Background is warm `#F6F4EE`.
- Cards sit elevated in pure `#FFFFFF` with a diffuse low-contrast shadow.

### Shadow Vocabulary
- **Elevated Card Shadow** (`box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.06)`): Used on the primary white container cards to lift them gently from the canvas.
- **Subtle Control Shadow** (`box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)`): Used on active buttons and step pills.

### Named Rules
**The No-Floating-Halo Rule.** Glows and zero-offset saturated colored halos are forbidden. Elevation is conveyed strictly through light-source offset and soft blurs.

## Shapes

- **Card Shells**: Generous rounded corners (`rounded-2xl` 16px to `rounded-3xl` 24px) to convey an approachable, non-sterile feel.
- **Pills & Steppers**: Fully rounded (`rounded-full` 9999px) for interactive pills, step indicators, and action buttons.
- **Form Controls**: Balanced curvature (`rounded-xl` 12px) for input fields, textareas, and selection tiles.
- **Borders**: Subtle 1px borders (`border-stone-200/90`) prevent white surfaces from bleeding into the light canvas.

## Components

### Buttons
- **Shape**: Fully rounded pill (`rounded-full`).
- **Primary**: Solid Obsidian `#0F172A`, text `#FFFFFF`, padding `10px 28px`, subtle hover lighten `#1E293B`, active scale `95%`.
- **Secondary / Back**: White `#FFFFFF`, text `#334155`, border `1px solid #D6D3D1`, padding `10px 24px`, hover `#F5F5F4`.

### Pill Selectors & Tags
- **Selected**: Light sage background (`#D1FAE5`), emerald text (`#064E3B`), border `#86EFAC`, font weight semi-bold.
- **Unselected**: White background (`#FFFFFF`), slate text (`#334155`), border `#D6D3D1`, subtle hover `#FAFAF9`.

### Input Fields
- **Shape**: Curvature `rounded-xl` (12px).
- **Background**: Soft warm-tinted off-white (`#F9F9F8`).
- **Border**: `1px solid #E7E5E4`, transitions to deep teal ring (`focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700`).
- **Typography**: Dark text `#0F172A`, small uppercase bold labels `#334155`.

### Stepper Track
- **Geometry**: Pinned exactly at `top-[18px]` through the vertical center of `36px` (`w-9 h-9`) circles.
- **Horizontal Bounds**: Anchored from column 1 center (`left-[12.5%]`) to column 4 center (`right-[12.5%]`).
- **State Fill**: Teal fill advances with formula `calc(${((currentStep - 1) / (steps.length - 1))} * 75%)`.

### Disclaimer & Notice Banners
- **Style**: Soft warm amber `#FEF3C7` with `#FCD34D` border, rounded-2xl (16px).
- **Icon**: Distinct exclamation symbol in a rounded badge.
- **Copy**: Non-diagnostic limitation notice plainly stated without alarmist language.

## Do's and Don'ts

### Do:
- **Do** maintain high contrast (`text-slate-900` on white surfaces) for all vital metrics and titles.
- **Do** align progress lines strictly to the geometric centers of step icons and nodes.
- **Do** include the standard non-diagnostic medical disclaimer on all measurement, result, and dashboard screens.
- **Do** use warm sage-green (`#D1FAE5`) for positive/normal health indicators to promote emotional calmness.

### Don't:
- **Don't** use harsh pure black (`#000000`) or saturated pure red (`#FF0000`) on normal wellness UI.
- **Don't** add unlayered plain element rules (`h1 { ... }`) in CSS that can accidentally override Tailwind utility classes across dark/light themes.
- **Don't** introduce generic AI kicker/eyebrow labels above headings.
- **Don't** use emojis in place of clean, consistent SVG iconography.
