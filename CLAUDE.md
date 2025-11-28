# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome extension that provides an AI-powered sidebar chat interface for financial assistance. The extension uses Vue 3 with TypeScript, Vite for building, and integrates with a backend API for AI chat functionality.

## Development Commands

- **Development server**: `npm run dev` - Starts the Vite development server with proxy to localhost:8080
- **Build**: `npm run build` - Runs TypeScript compilation (`vue-tsc -b`) and builds the extension using Vite
- **Preview**: `npm run preview` - Previews the built extension

## Architecture

### Core Technologies
- **Frontend**: Vue 3 with Composition API and TypeScript
- **Build Tool**: Vite with Vue plugin
- **UI Framework**: Element Plus
- **State Management**: Pinia
- **Routing**: Vue Router with hash history
- **Extension**: Chrome Extension Manifest V3 with side panel

### Project Structure
- `src/main.ts` - Application entry point with router configuration
- `src/App.vue` - Root component with router view
- `src/components/` - Vue components (ChatMain.vue, HistoryPage.vue)
- `src/stores/chat.js` - Pinia store for chat state and API interactions
- `public/` - Static assets including manifest.json and background.js
- `sidepanel.html` - Main extension HTML entry point

### Key Features
- **SSE Chat**: Real-time chat using Server-Sent Events with Dify API integration
- **Message Rating**: Thumbs up/down rating system with feedback collection
- **Conversation Management**: Session-based conversation tracking
- **Side Panel**: Chrome extension side panel interface

### API Integration
- **Chat Endpoint**: `${API_BASE_URL}/api/chat` - SSE stream for AI responses
- **Feedback Endpoint**: `${API_BASE_URL}/api/feedback` - Submit message ratings and feedback
- **History Endpoints**: `${API_BASE_URL}/api/history/conversations` - Fetch conversation history
- **Environment Configuration**: API base URL configured via `VITE_API_BASE_URL` environment variable (default: `http://localhost:8080`)
- **Extension Permissions**: Manifest includes `host_permissions` for API domain access

### Extension Configuration
- **Manifest**: Manifest V3 with side panel permissions
- **Background Script**: Minimal script to enable side panel behavior
- **Build Output**: Extension files are built to `dist/` directory

### Development Notes
- The project uses strict TypeScript configuration with Vue-specific settings
- CSS is handled through Element Plus and custom styles in `src/style.css`
- The chat store handles all API interactions and state management
- Build configuration includes specific rollup options for extension packaging
- **Environment Variables**: API base URL is configurable via `.env` file (see `.env.example`)
- **Cross-Origin Requests**: Chrome extension requires `host_permissions` for external API access