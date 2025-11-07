# Figma Make Token Merge (2025-11-06)

This file tracks the design-token adjustments performed while porting the Figma Make UI into the existing CRM frontend.

## Updated tokens

| Token | Old value (approx.) | New value | Rationale |
| --- | --- | --- | --- |
| `--background` | `0 0% 100%` | `210 40% 97%` | Softer slate background to match Figma dashboard canvas. |
| `--foreground` | `222.2 84% 4.9%` | `222 47% 12%` | Warmer dark text colour for improved contrast on the lighter canvas. |
| `--primary` / `--primary-foreground` | Blue palette | `21 88% 55%` / `26 100% 97%` | Switch primary accent to the orange brand used throughout the Figma kit. |
| `--secondary` / `--secondary-foreground` | Cool grey palette | `26 100% 92%` / `24 94% 35%` | Light warm neutrals for secondary chips, filters and indicators. |
| `--muted` / `--muted-foreground` | Cool grey palette | `215 33% 92%` / `217 19% 35%` | Benchlined neutral surfaces used for table rows and sidebar hover states. |
| `--accent` / `--accent-foreground` | Mirrored `--secondary` | `24 100% 94%` / `24 94% 32%` | Dedicated accent surface for highlight badges and hover states. |
| `--destructive` | `0 84.2% 60.2%` | `0 72% 50%` | Align with the red tone defined in the Figma error components. |
| `--border` & `--input` | `214.3 31.8% 91.4%` | `210 29% 85%` | Increase contrast for card, table and form outlines. |
| `--ring` | Matches old primary | Matches new `--primary` | Ensure focus halos use the orange accent. |
| `--radius` | `0.5rem` | `0.75rem` | Larger corner radius to match Figma cards and inputs. |
| `--chart-1` to `--chart-5` | Blue/green set | Warm orange, blue, green, amber, pink palette | Sync Recharts colour scheme with Figma analytics cards. |

## Dark theme adjustments

Dark theme counterparts were re-balanced to maintain contrast against the new primary and surface tones. Values mirror the light-token changes while respecting WCAG contrast ratios on charcoal backgrounds.

## Component updates linked to tokens

- `components/ui/button.tsx` - inherits the orange primary, refreshed focus recipe.
- `components/ui/badge.tsx`, `components/ui/card.tsx`, `components/ui/input.tsx`, `components/ui/select.tsx`, `components/ui/checkbox.tsx`, `components/ui/table.tsx`, `components/ui/textarea.tsx` - updated spacing, border radius and focus halos to leverage the new tokens.
