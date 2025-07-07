# 우리가게 패키지 리뷰 분석 대시보드

## Overview

This is a full-stack review analytics dashboard application built for analyzing app store reviews. The application provides comprehensive insights into user feedback from Google Play Store and Apple App Store, featuring sentiment analysis, word cloud visualization, and UX insights generation.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **API Pattern**: RESTful API with structured error handling

### Project Structure
- **Monorepo Layout**: Client and server code in separate directories
- **Shared Schema**: Common TypeScript types and database schema in `/shared`
- **Client**: React frontend in `/client`
- **Server**: Express backend in `/server`

## Key Components

### Database Schema
- **Users**: Basic user authentication system
- **Reviews**: Store review data with sentiment analysis
- **Insights**: UX insights with priority levels and trend tracking  
- **Word Cloud Data**: Frequency-based word analysis for sentiment visualization

### API Endpoints
- `GET /api/reviews` - Paginated review listing with filtering
- `GET /api/reviews/stats` - Review statistics and metrics
- `GET /api/insights` - UX insights and recommendations
- `GET /api/wordcloud/{sentiment}` - Word cloud data for visualization

### UI Components
- **Dashboard**: Main analytics view with multiple data sections
- **Filter Section**: Advanced filtering by source, date range
- **Stats Overview**: Key metrics and KPI cards
- **Review List**: Paginated review display with sentiment indicators
- **Word Cloud**: Visual representation of frequently mentioned terms
- **UX Insights**: Actionable insights with priority levels

## Data Flow

1. **Review Collection**: Backend processes reviews from app stores
2. **Sentiment Analysis**: Reviews are analyzed and categorized as positive/negative
3. **Insight Generation**: System generates UX insights based on review patterns
4. **Word Cloud Processing**: Frequently mentioned words are extracted and categorized
5. **Frontend Display**: React components consume API data with real-time updates
6. **Filtering & Pagination**: Client-side filtering with server-side pagination

## External Dependencies

### Frontend Dependencies
- **UI Framework**: React 18 with TypeScript
- **Component Library**: Radix UI primitives with shadcn/ui
- **Data Fetching**: TanStack Query for server state
- **Styling**: Tailwind CSS with custom design system
- **Date Handling**: date-fns for date manipulation
- **Form Handling**: React Hook Form with Zod validation

### Backend Dependencies
- **Database**: Drizzle ORM with PostgreSQL dialect
- **Validation**: Zod for schema validation
- **Session Management**: connect-pg-simple for PostgreSQL sessions
- **Development**: tsx for TypeScript execution

### Development Tools
- **Build**: Vite for frontend, esbuild for backend
- **Development**: Replit integration with error overlay
- **Database Migrations**: Drizzle Kit for schema management

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized static assets to `/dist/public`
- **Backend**: esbuild bundles server code to `/dist/index.js`
- **Database**: Drizzle migrations applied via `db:push` command

### Environment Configuration
- **Development**: Uses tsx for hot reloading and Vite dev server
- **Production**: Serves static files from Express with built frontend
- **Database**: Requires `DATABASE_URL` environment variable

### Scripts
- `dev`: Development server with hot reloading
- `build`: Production build for both frontend and backend
- `start`: Production server startup
- `db:push`: Apply database schema changes

## Changelog

Changelog:
- July 07, 2025. Initial setup
- July 07, 2025. Added Google Play Store review scraping functionality using Python google-play-scraper library
- July 07, 2025. Integrated real-time review collection with sentiment analysis and word cloud generation
- July 07, 2025. Enhanced Korean text processing for better word frequency analysis

## User Preferences

Preferred communication style: Simple, everyday language.