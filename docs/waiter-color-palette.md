# ServeIQ Waiter — Color Palette (Flutter)

## Theme Overview
- **Mode:** Dark
- **Primary:** Green (`#4be277`)
- **Background:** Deep navy (`#0c1324`)
- **Surfaces:** Layered dark cards with glass morphism

---

## Brand / Primary

| Token             | Hex       | Usage                      |
|-------------------|-----------|----------------------------|
| Primary           | `#4be277` | Accent icons, CTAs, active states, tab indicator |
| On Primary        | `#003915` | Text/icon on green backgrounds |
| Primary Container | `#22c55e` | Buttons, badges |
| Inverse Primary   | `#006e2f` | Green on light elements |

## Surfaces

| Token                       | Hex       | Usage              |
|-----------------------------|-----------|---------------------|
| Background                  | `#0c1324` | Page background     |
| Surface                     | `#0c1324` | Same as bg          |
| Surface Container Lowest    | `#070d1f` | Bottom nav          |
| Surface Container Low       | `#151b2d` | Slightly elevated   |
| Surface Container           | `#191f31` | Cards, login panel  |
| Surface Container High      | `#23293c` | Higher elevation    |
| Surface Container Highest   | `#2e3447` | Highest elevation   |

## Text

| Token              | Hex       | Usage                |
|--------------------|-----------|----------------------|
| On Surface         | `#dce1fb` | Body/primary text    |
| On Surface Variant | `#bccbb9` | Muted/secondary text |
| On Background      | `#dce1fb` | Body text            |

## Feedback / Status

| Token             | Hex       | Usage                     |
|-------------------|-----------|---------------------------|
| Success / Active  | `#22C55E` | Available table, valid    |
| Error             | `#EF4444` | Occupied, delete, error   |
| Warning           | `#EAB308` | Reserved, cleaning, paying|
| VIP / Gold        | `#f59e0b` | VIP badge, icons          |
| Info / Blue       | `#3b82f6` | Chart, secondary info     |

## Glass Morphism

```dart
// Standard glass card
BoxDecoration(
  color: Color(0x0DFFFFFF),        // rgba(255,255,255,0.05)
  borderRadius: BorderRadius.circular(24),
  border: Border.all(
    color: Color(0x33FFFFFF),      // rgba(255,255,255,0.2)
  ),
);
```

- **Backdrop filter:** `blur(32px)` via `BackdropFilter` widget
- **Nav/Footer glass:** `Color(0xCC0C1324)` — 80% background opacity

## Borders & Dividers

| Token             | Hex                  | Usage              |
|-------------------|----------------------|---------------------|
| Outline           | `#869585`            | Borders            |
| Outline Variant   | `#3d4a3d`            | Subtle borders     |
| Default border    | `rgba(64,71,88,0.2)` | Card borders       |
| White subtle      | `rgba(255,255,255,0.06)` | Glass card borders|

## Mesh Background Gradient (Tables page)

```dart
Stack(
  children: [
    Positioned(
      top: 0, left: 0,
      child: Container(
        width: 300, height: 300,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Color(0x264BE277),   // rgba(75,226,119,0.15)
          blurRadius: 120,
        ),
      ),
    ),
    // Repeat for other blobs at different positions
  ],
)
```

## Skeleton / Shimmer

```dart
LinearGradient(
  colors: [
    Color(0xFF191F31),   // base
    Color(0xFF23293C),   // mid highlight
    Color(0xFF191F31),   // end
  ],
);
```

## Legacy Theme (Orange — optional fallback)

| Token       | Hex       |
|-------------|-----------|
| Primary     | `#f97316` |
| Background  | `#0F0F0F` |
| Surface     | `#1A1A1A` |
| On Surface  | `#ffffff` |

## Typography

- **Body font:** Inter
- **Heading font:** Space Grotesk (especially for monetary values)
- **Font weights:** Regular 400, Medium 500, Semibold 600, Bold 700
- **Body text size:** 14–16px
- **Headings:** 20–32px

## Key Shadows / Glows

```dart
// Primary green glow on CTAs:
BoxShadow(
  color: Color(0x664BE277),  // rgba(75,226,119,0.4)
  blurRadius: 20,
)

// Active state green glow:
BoxShadow(
  color: Color(0x334BE277),  // rgba(75,226,119,0.2)
  blurRadius: 12,
)
```
