# Web Summary Chrome Extension

## Demo

[Video - Web summary](https://www.youtube.com/watch?v=ID_DE_LA_VIDEO)

## Overview
A Chrome extension that uses Cohere AI to generate concise summaries of web pages and stores them in a Supabase database. Users can view their summary history and manage their saved summaries.

## Features
- AI-powered summarization using Cohere AI
- Persistent storage with Supabase
- Responsive popup interface
- Real-time summary generation
- History management
- Secure data handling

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS
- **Icons**: Lucide React
- **AI**: Cohere AI API
- **Database**: Supabase
- **Build**: CRXJS Vite Plugin

## Project Structure
```
web-summarize-extension/
├── src/
│   ├── components/         # React components
│   │   └── SummaryList.tsx
│   ├── lib/               # Utility functions and API clients
│   │   ├── cohere.ts      # Cohere AI integration
│   │   └── supabase.ts    # Supabase client and queries
│   ├── App.tsx            # Main application component
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles
├── public/
│   └── icons/            # Extension icons
├── manifest.json         # Chrome extension manifest
├── .env                 # Environment variables
└── vite.config.ts       # Vite configuration
```

## Setup Instructions

### Prerequisites
1. Node.js (v18 or higher)
2. A Supabase account and project
3. A Cohere AI API key

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```

## Extension pics

There is somes pictures of the Web Summary chrome extension : 

<div align="center">
  <img src="/img/web-summary-pic.png" width="30%" style="margin-right:10px">
  <img src="/img/web-summary-pic2.png" width="30%" style="margin-right:10px">
  <img src="/img/web-summary-pic3.png" width="30%">
</div>

Thank you.

