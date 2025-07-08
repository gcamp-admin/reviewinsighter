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

1. **Review Collection**: Python scraper collects real reviews from Google Play Store and Apple App Store
2. **Sentiment Analysis**: Reviews are analyzed and categorized as positive/negative based on ratings
3. **Korean Text Processing**: Advanced Korean text analysis for meaningful word extraction
4. **Insight Generation**: System generates UX insights based on review patterns and frequency
5. **Word Cloud Processing**: Frequently mentioned Korean words are extracted and categorized by sentiment
6. **Data Storage**: Reviews, insights, and word cloud data are stored in memory storage
7. **Frontend Display**: React components consume API data with real-time updates
8. **Filtering & Pagination**: Client-side filtering with server-side pagination

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
- July 07, 2025. Added Apple App Store review scraping using RSS feeds for complete dual-platform support
- July 07, 2025. Successfully tested live review collection from both Google Play Store and Apple App Store with Korean content
- July 08, 2025. Completely rewrote HEART framework to analyze actual review content instead of generic patterns
- July 08, 2025. Enhanced pattern matching to detect real user issues like call dropping, Bluetooth problems, and specific app complaints
- July 08, 2025. Updated insights generation to be based on authentic Korean review content with proper priority classification (Critical/Major/Minor)
- July 08, 2025. Added improved debugging capabilities and loading indicators for better user experience
- July 08, 2025. Confirmed backend APIs working perfectly with real-time data collection and accurate analytics display
- July 08, 2025. Enhanced HEART framework analysis with dynamic insights based on actual review content
- July 08, 2025. Implemented structured output format with problem summary, solutions, and priority classification  
- July 08, 2025. Fixed word cloud to display maximum 10 words as requested
- July 08, 2025. Completely separated UI display - analysis blocks only show after AI analysis button is clicked
- July 08, 2025. Improved Korean text processing and sentiment analysis for more accurate insights generation
- July 08, 2025. Successfully resolved JSON parsing errors and system collection issues
- July 08, 2025. Fixed word cloud frontend limiting to 10 words maximum as requested
- July 08, 2025. Enhanced Python analysis system now correctly generates insights and word clouds
- July 08, 2025. System collecting reviews properly and generating analysis data with word cloud word count working correctly

## User Preferences

Preferred communication style: Simple, everyday language.