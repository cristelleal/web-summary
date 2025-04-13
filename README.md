# Web Summary Chrome Extension

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

## Features in Detail

### Summarization
- Uses Cohere AI's summarization API
- Automatically extracts main content from web pages
- Removes noise (scripts, styles, navigation, etc.)
- Configurable summary length and style

### Storage
- Real-time synchronization with Supabase
- Row Level Security (RLS) enabled
- User-specific data isolation
- Automatic conflict resolution

### User Interface
- Clean, modern design with Tailwind CSS
- Responsive popup window (400x400 pixels)
- Loading states and error handling
- Smooth animations and transitions

## Security
- Uses Chrome's `activeTab` permission for minimal access
- Secure API key handling
- Data isolation through RLS policies
- No sensitive data stored locally

## License
MIT License - feel free to use this project for any purpose.

Thank you# web-summary
