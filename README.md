# jove-political-data-viz

A Claude skill for building political and election data visualizations
in React and TypeScript. Authored by Jupiter Baudot (jove).

Generates complete working components — not just code snippets.
Covers gubernatorial, senate, and house of representatives races.
Follows NYT/Visx production standards.

---

## What It Does

- Recommends the right chart type based on your data and goal
- Recommends the right library based on complexity
- Generates complete React/TypeScript components with loading, error, and empty states
- Handles single-source and multi-source data aggregation
- Normalizes any election data API into consistent canonical shapes
- Applies accessible defaults with optional design token override

---

## Chart Types Covered

- Candidate comparison bar chart
- Polling trend line (FiveThirtyEight style — dots + aggregate line)
- Vote share area chart
- Exit poll grouped bar (multi-demographic)
- Electoral vote donut
- Multi-source real-time polling feed
- Toggleable bar chart (switch between two variables)

## Map Types Covered

- National choropleth — state level (react-simple-maps)
- Choropleth with zoom to bounding box — district drill-down (D3 + TopoJSON)
- Square cartogram — equal-area hexmap (D3)

---

## Installation

### Claude.ai
1. Download or clone this repo
2. Zip the `jove-political-data-viz` folder
3. Open Claude.ai → Settings → Capabilities → Skills
4. Click Upload Skill and select the zip

### Claude Code
Place the `jove-political-data-viz` folder in your Claude Code skills directory.

---

## Usage

Once installed, trigger the skill naturally:

- "Build me a polling trend chart for three candidates"
- "Create a national map colored by the leading candidate"
- "I have exit poll data by demographic — what should I build?"
- "Which chart should I use for multi-source real-time polling?"

The skill follows a three-step flow: clarify → recommend → build.
It will ask a few questions before generating any code.

---

## Libraries Used

| Library | Purpose |
|---|---|
| Visx | Production-quality charts |
| Recharts | Fast standard charts |
| Lightweight Charts | Real-time feeds |
| D3 + TopoJSON | District maps, cartograms |
| react-simple-maps | National/state choropleth |

---

## Recommended Models

| Model | Use For |
|---|---|
| Haiku 4.5 | Simple bar, pie, donut charts |
| Sonnet 4.6 | Most charts and maps (default) |
| Opus 4.8 | District maps, full dashboards, first-pass production quality |

---

## Contributing

This project is open source and actively welcoming contributions. See
[CONTRIBUTING.md](CONTRIBUTING.md) for the full guide — what to contribute,
how to test the skill, how to write a PR, and the current backlog of proposed
additions.

---

## License

MIT — Jupiter Baudot (jove) 2025
