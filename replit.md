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
- July 08, 2025. Enhanced Python analysis to generate specific problems and solutions based on actual review content instead of generic patterns
- July 08, 2025. Improved pattern matching to detect real issues like "통화 기능 오류", "로그인/인증 문제", "연락처/단축번호 기능 오류"
- July 08, 2025. Analysis now provides specific technical solutions based on actual user complaints from reviews
- July 08, 2025. Implemented realistic problem predictions and solutions format - insights now include "예측되는 문제점" and "해결 방법" sections
- July 08, 2025. Enhanced HEART framework analysis to provide context-specific solutions (Task Success: VoIP 서버 안정성 강화, Happiness: 사용자 테스트 실시, Retention: 사용자 생명주기별 맞춤 서비스)
- July 10, 2025. Completely redesigned UX analysis system with professional UX researcher methodology
- July 10, 2025. Implemented authentic user quote extraction from reviews for problem summaries with emotional impact
- July 10, 2025. Enhanced analysis format with structured sections: HEART 항목, 문제 요약 (with user quotes), 해결 방안, 기술적 구현, 우선순위
- July 10, 2025. Updated frontend UX insights component with professional presentation - color-coded sections for problem/solution/implementation
- July 10, 2025. Analysis now captures real user expressions and complaints for authentic problem identification
- July 10, 2025. System generates actionable technical solutions that development teams can implement directly
- July 10, 2025. Updated analysis format from "기술적 구현" to "UX 개선 제안" focusing on user experience improvements
- July 10, 2025. Enhanced UX methodology to provide concrete, implementable solutions with specific UI components and user flow improvements
- July 10, 2025. Analysis now includes detailed UX suggestions like progress bars, error handling dialogs, and user-friendly messaging
- July 10, 2025. System generates realistic UX improvements that address actual user pain points mentioned in reviews
- July 10, 2025. Final enhancement: UX analysis now strictly follows actual user review quotes and expressions for authentic problem identification
- July 10, 2025. Implemented sophisticated quote extraction to detect specific user pain points like "나가버림", "화면 확대 안됨", "답답하다" etc.
- July 10, 2025. UX improvement suggestions now provide concrete, implementable solutions with exact UI messages and user interaction flows
- July 10, 2025. Analysis maintains strict logical connection between user review expressions and proposed UX solutions
- July 10, 2025. Completely rewrote UX suggestion generation to focus on specific user cognition, behavior flow, and interface experience improvements
- July 10, 2025. Enhanced quote-based analysis to detect exact user expressions like "통화중 대기가 되지 않아서 불편하네요", "볼륨버튼 누르면 진동이 꺼지면 좋겠네요" etc.
- July 10, 2025. UX suggestions now provide concrete UI solutions: button placement, message content, interaction flows, and visual feedback based on actual user pain points
- July 10, 2025. Eliminated generic and abstract suggestions - all UX improvements are now logically connected to specific user expressions and problems
- July 10, 2025. Implemented complete text-based sentiment analysis that ignores app store star ratings completely
- July 10, 2025. Added priority rule: any review containing '불편' (uncomfortable/inconvenient) is automatically classified as negative
- July 10, 2025. Implemented strict date validation requirements for analysis: start date is mandatory, end date defaults to today if not provided, validates date range order
- July 10, 2025. Fixed word cloud generation issue: modified analysis to use review sentiment classification instead of keyword matching for better word extraction
- July 10, 2025. Resolved date filtering problem in analysis endpoint - system now correctly processes reviews within specified date ranges
- July 10, 2025. Successfully implemented word cloud display with 10 positive and 10 negative Korean words extracted from actual user reviews
- July 11, 2025. Implemented date range validation with warning messages when end date is before start date
- July 11, 2025. Added visual indicators (red borders) and disabled buttons for invalid date ranges
- July 11, 2025. Made "종료날짜" (end date) a required field with proper validation and error messaging
- July 11, 2025. Enhanced form validation to prevent submission when date range is invalid or required dates are missing
- July 11, 2025. Increased review collection limit from 100 to 500 reviews per source to capture more comprehensive data
- July 11, 2025. Optimized collection to gather up to 300 Google Play reviews and 49 App Store reviews (RSS feed limitation)
- July 11, 2025. Enhanced Korean text processing with advanced libraries (wordcloud, matplotlib, konlpy)
- July 11, 2025. Improved word cloud generation with morphological analysis for better Korean language understanding
- July 11, 2025. Implemented complete multi-source review collection system with 4 sources: Google Play Store, Apple App Store, Naver Blog, Naver Cafe
- July 11, 2025. Added comprehensive store selection interface with checkboxes for all four sources, all selected by default
- July 11, 2025. Updated backend to handle new JSON payload structure with selectedService and selectedChannels format
- July 11, 2025. Enhanced Python scraper with Naver Blog and Naver Cafe scraping functions (currently using mock data for demonstration)
- July 11, 2025. Improved frontend-backend communication with proper JSON structure for multi-source data collection
- July 11, 2025. Integrated real Naver API for authentic Blog and Cafe review collection using provided API credentials
- July 11, 2025. Implemented comprehensive HTML text extraction and content processing for Naver search results
- July 11, 2025. Enhanced keyword-based search strategy using service-specific keywords for better review targeting
- July 11, 2025. Successfully tested complete multi-source collection system with 729 reviews collected from all four sources
- July 11, 2025. Created comprehensive crawler.py module for unified multi-source review collection
- July 11, 2025. Verified system performance with real-time collection from Google Play, Apple App Store, Naver Blog, and Naver Cafe
- July 11, 2025. Enhanced Naver API search with exact keyword matching using quotes for more precise results
- July 11, 2025. Confirmed system fully operational with 729 reviews collected and real-time analysis generating insights and word clouds
- July 11, 2025. Successfully resolved frontend review display issues - reviews now show properly after collection
- July 11, 2025. Implemented URL link functionality for Naver reviews as requested by user
- July 11, 2025. Fixed caching issues and added proper debugging logs for review data fetching
- July 11, 2025. Verified complete end-to-end functionality: collection → storage → display → analysis working perfectly
- July 11, 2025. Enhanced review list display with emoji icons and improved formatting as requested
- July 11, 2025. Added date formatting (YYYY.MM.DD) and proper pagination support for up to 10 pages
- July 11, 2025. Implemented review quality filtering for Naver content to exclude promotional/press content
- July 11, 2025. Added is_likely_user_review function to filter authentic user reviews from blog/cafe results

## User Preferences

Preferred communication style: Simple, everyday language.