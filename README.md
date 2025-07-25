# Gami AI - Frontend

Gami AI is an interactive, AI-powered learning platform for coding and problem solving. This repository contains the frontend (Next.js + React) for the Gami AI system.

## Features

- AI assistant for hints, explanations, and lesson navigation
- Interactive coding problems with real-time code execution and feedback
- Lesson and problem recommendations powered by AI
- User progress tracking and motivational feedback
- Modern, responsive dashboard UI

## Getting Started

First, install dependencies:

```bash
npm install
# or
yarn install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to use the app.

## Project Structure

- `src/app/` - Main Next.js app pages and routing
- `src/components/` - Reusable UI components (AI assistant, code editor, problem panels, etc.)
- `src/utils/` - Utility functions and API helpers

## Environment Variables

Create a `.env.local` file and set the following (example):

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_AI_BASE_URL=http://localhost:4000
```

## Contributing

Pull requests and issues are welcome! Please open an issue to discuss your ideas or report bugs.

## License

This project is for educational and research purposes.

---

**Author:** [td-bui](https://github.com/td-bui)