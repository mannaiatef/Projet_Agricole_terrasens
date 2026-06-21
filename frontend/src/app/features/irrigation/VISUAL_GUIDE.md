# Irrigation Service Design - Visual Guide

## 📱 Dashboard Layout Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  💧 Irrigation Management System                Last Update: Now │
│  Real-time recommendations based on weather      Priority: HIGH  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌───────────────────────────────────────────┐│
│  │ 🌾 Your      │  │                                           ││
│  │ Fields (4)   │  │  ⚠️ URGENT IRRIGATION REQUIRED            ││
│  │              │  │  The field is experiencing critical stress││
│  │ [Field A]✓   │  │  [Take Action Now]                        ││
│  │ [Field B]    │  └───────────────────────────────────────────┘│
│  │ [Field C]    │                                               │
│  │ [North Zone] │  💧 Recommendation 📅 Schedule 📋 History    │
│  │              │  ┌───────────────────────────────────────────┐│
│  │ ─────────────│  │                                           ││
│  │ [⚡ Calculate]│  │ FIELD DETAILS                             ││
│  │ [📊 Latest]  │  │ Field A - Wheat                           ││
│  │ [📈 History] │  │ Priority: HIGH ⓘ                          ││
│  │              │  │                                           ││
│  │              │  │ 💧 Water: 45mm │ 🌱 Stress: 78%           ││
│  │              │  │ ⏱️ Duration: 120 min │ 📍 Area: 5.2ha     ││
│  │              │  │                                           ││
│  │              │  │ 🌤️ Weather Conditions                    ││
│  │              │  │ 🌡️ 28°C  💧 65%  🌧️ 2.5mm  ☁️ Sunny    ││
│  │              │  │                                           ││
│  │              │  │ 🌿 Plant Health (NDVI): 0.65 ✓ Healthy   ││
│  │              │  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      ││
│  │              │  │                                           ││
│  │              │  │ [⚡ Recalculate] [📅 Schedule] [Details]  ││
│  └──────────────┘  └───────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Color Palette

### Primary Colors
```
┌─────────────────────────────────┐
│ Primary Blue: #2563eb          │ ← Main actions, headers
│ Accent Cyan: #06b6d4           │ ← Secondary actions
│ Success Green: #22c55e         │ ← Healthy status
└─────────────────────────────────┘
```

### Status Colors
```
┌─────────────────────────────────┐
│ 🔴 High Priority: #dc2626       │ ← Critical/Urgent
│ 🟡 Medium Priority: #f59e0b     │ ← Warning
│ 🟢 Low Priority: #22c55e        │ ← Normal/Good
└─────────────────────────────────┘
```

---

## 📊 Metric Cards Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  METRICS SECTION                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │ 💧 Water       │  │ 🌱 Plant Stress│  │ ⏱️ Duration    │   │
│  │ Amount         │  │                │  │                │   │
│  │ ───────────    │  │ ───────────    │  │ ───────────    │   │
│  │ 45 mm          │  │ 78%            │  │ 120 min        │   │
│  │                │  │ ███████░░      │  │                │   │
│  │ 235 m³ total   │  │ 🔴 High Stress │  │ Recommended    │   │
│  └────────────────┘  └────────────────┘  │ 8:00 AM - 10:00│   │
│                                           └────────────────┘   │
│  ┌────────────────┐                                            │
│  │ 📍 Field Area  │                                            │
│  │ ───────────    │                                            │
│  │ 5.2 ha         │                                            │
│  │ Parcel size    │                                            │
│  └────────────────┘                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🌤️ Weather Section

```
┌─────────────────────────────────────────────────────────────────┐
│  🌤️ WEATHER CONDITIONS                             Current     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │ 🌡️ Temperature │  │ 💧 Humidity    │  │ 🌧️ Rain (24h)  │   │
│  │ 28.5°C         │  │ 65%            │  │ 2.5 mm         │   │
│  └────────────────┘  └────────────────┘  └────────────────┘   │
│                                                                 │
│  ┌────────────────┐                                            │
│  │ ☁️ Conditions  │                                            │
│  │ Partly Cloudy  │                                            │
│  └────────────────┘                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🌿 NDVI Health Indicator

```
┌─────────────────────────────────────────────────────────────────┐
│  🌿 PLANT HEALTH (NDVI)                         Health Indicator│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  NDVI Scale:                                                    │
│  ╔════════════════════════════════════════════════════════╗    │
│  ║ 🔴      🟠      🟡      🟢      💚      🟢 ║  0.65 ↓ │    │
│  ║ -1       0       0.3      0.5      0.8      1  ║         │    │
│  ╚════════════════════════════════════════════════════════╝    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ✓ Healthy Vegetation                                   │   │
│  │ NDVI above 0.5 indicates good plant health             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Calculation Details

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 CALCULATION DETAILS                         Algorithm Analysis│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ ET₀          │  │ Kc           │  │ ETc          │         │
│  │ Reference    │  │ Crop         │  │ Crop         │         │
│  │ Evapotrans.  │  │ Coefficient  │  │ Evapotrans.  │         │
│  │ 6.45 mm/day  │  │ 0.85         │  │ 5.48 mm/day  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Base Amount  │  │ Stress Adj.  │  │ Humidity Adj.│         │
│  │ Base Water   │  │ Stress       │  │ Humidity     │         │
│  │ Amount       │  │ Adjustment   │  │ Adjustment   │         │
│  │ 38.2 mm      │  │ 1.2x         │  │ 0.95x        │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📅 Schedule Component

```
┌─────────────────────────────────────────────────────────────────┐
│  📅 IRRIGATION SCHEDULE                    [+ Add Schedule]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ● 2024-06-05, 08:00 AM                      2024-06-05 │   │
│  │                                                         │   │
│  │ 💧 45mm  │  ⏱️ 120 minutes  │  💡 Optimal            │   │
│  │                                                         │   │
│  │                                    [Edit] [Delete]      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ◐ 2024-06-04, 06:00 AM                      2024-06-04 │   │
│  │                                                         │   │
│  │ 💧 35mm  │  ⏱️ 90 minutes   │  💡 In Progress        │   │
│  │                                                         │   │
│  │                                    [Edit] [Delete]      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 History Component

```
┌─────────────────────────────────────────────────────────────────┐
│  📋 IRRIGATION HISTORY                                          │
├─────────────────────────────────────────────────────────────────┤
│  Filter by: [All Methods ▼]  Sort by: [Latest First ▼]        │
│                                                                 │
│  STATISTICS:                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ 💧 Total Water   │  │ 📊 Average/Session│  │ 🔔 Sessions  │ │
│  │ 450.5 mm         │  │ 42.3 mm          │  │ 12           │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                 │
│  HISTORY:                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🤖 Automatic              2024-06-04 08:15             │   │
│  │ 💧 45mm | ⏱️ 120min | ✓ Completed                      │   │
│  │                                                         │   │
│  │ ┌──────────────────────────────────────────────────┐   │   │
│  │ │ Soil Moisture: 65% | Temperature: 28°C         │   │   │
│  │ │ Humidity: 68% | NDVI: 0.63                      │   │   │
│  │ └──────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 👤 Manual                 2024-06-03 18:45             │   │
│  │ 💧 35mm | ⏱️ 90min | ✓ Completed                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Button Styles

### Primary Button (Main Actions)
```
┌─────────────────────────────┐
│ ⚡ Recalculate              │
│ Blue gradient background    │
│ White text                  │
│ Hover: Lift effect + glow   │
└─────────────────────────────┘
```

### Accent Button (Secondary Actions)
```
┌─────────────────────────────┐
│ 📅 Schedule Now             │
│ Cyan gradient background    │
│ White text                  │
│ Hover: Lift effect + glow   │
└─────────────────────────────┘
```

### Outline Button (Tertiary Actions)
```
┌─────────────────────────────┐
│ 📋 Details                  │
│ Transparent background      │
│ Gray text with border       │
│ Hover: Blue highlight       │
└─────────────────────────────┘
```

---

## 🔔 Alert Types

### High Priority Alert
```
┌──────────────────────────────────────────┐
│ ⚠️ 🚨 Urgent Irrigation Required        │
│                                          │
│ The field is experiencing critical      │
│ water stress and requires immediate     │
│ irrigation.                              │
│                                          │
│ [Take Action Now]                    ✕  │
└──────────────────────────────────────────┘
Red/Orange alert with action button
```

---

## 📱 Responsive Breakpoints

### Desktop (1024px+)
- Two-column layout (sidebar + content)
- 4-column metric grid
- Full sidebar visible

### Tablet (768px - 1024px)
- Horizontal sidebar
- 2-column metric grid
- Adapted controls

### Mobile (<768px)
- Single column
- Vertical layout
- Full-width components
- Stacked buttons

---

## ✨ Animation Examples

### Fade In
```
Opacity: 0 → 1
Duration: 0.4s
Used for: Tab content entrance
```

### Slide Down
```
Transform: translateY(-12px) → 0
Opacity: 0 → 1
Duration: 0.3s
Used for: Alerts and forms
```

### Hover Lift
```
Transform: translateY(-4px)
Duration: 0.3s
Used for: Cards on hover
```

### Pulse
```
Opacity: 1 → 0.6 → 1
Duration: 2s, infinite
Used for: Status indicators
```

---

## 📝 Typography Hierarchy

```
Page Title (1.8rem, Bold)
├─ Section Title (1.3rem, Bold)
│  ├─ Card Title (1.2rem, Bold)
│  ├─ Body Text (0.95rem, Regular)
│  ├─ Labels (0.9rem, Semibold)
│  └─ Small Text (0.8rem, Medium)
```

---

**Visual Design Version:** 2.0  
**Last Updated:** June 4, 2026
