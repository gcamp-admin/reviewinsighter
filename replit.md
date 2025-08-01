# commento.ai - AI 기반 리뷰 분석 플랫폼

## Overview

Commento.ai is a full-stack AI-powered review analytics dashboard designed to provide comprehensive insights into user feedback from app stores and social media. Its main purpose is to analyze reviews, generate UX insights, and visualize key themes to help businesses understand customer sentiment and improve their products. Key capabilities include sentiment analysis, word cloud visualization, and actionable UX insights generation. The project aims to be an AI UX mentor, enabling businesses to listen to their customers and leverage feedback for continuous improvement.

## User Preferences

Preferred communication style: Simple, everyday language.
Technical accuracy: Distinguish between "fixing broken functionality" and "improving/enhancing features" - use precise terminology.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized builds
- **UI/UX Decisions**: Modern design with animations, hover effects, glassmorphism elements, gradient texts, and a professional Korean font (LG Smart UI Font). Features include color-coded insights, interactive keyword bubble charts, and a unified analysis workflow.

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **API Pattern**: RESTful API with structured error handling
- **Project Structure**: Monorepo with client and server in separate directories, sharing common TypeScript types and database schema.

### Core Technical Implementations & Features
- **Review Collection**: Python scrapers collect reviews from Google Play Store, Apple App Store, Naver Blog, and Naver Cafe.
- **Sentiment Analysis**: GPT-powered (GPT-4o-mini) sentiment analysis categorizes reviews into positive, negative, and neutral, with rule-based pre-filtering and caching for cost optimization. Priority rules for negative keywords are implemented.
- **Korean Text Processing**: Advanced Korean text analysis using libraries like `konlpy` for morphological analysis and `wordcloud` for visualization.
- **UX Insight Generation (HEART Framework)**: AI-driven (GPT-4o) analysis generates actionable UX insights based on the HEART framework (Happiness, Engagement, Adoption, Retention, Task Success). It extracts authentic user quotes, provides specific UI/UX/GUI/Flow improvement suggestions, and includes service-specific third-party UX benchmarking. Insights are structured with problem summaries, competitor benchmarks, and UX improvement suggestions.
- **Word Cloud/Keyword Visualization**: Generates contextually relevant Korean word clouds or interactive keyword bubble charts (with collision prevention) and keyword network graphs from review content, categorized by sentiment.
- **Data Flow**: Reviews are collected, sentiment analyzed, processed for insights and word clouds, stored, and displayed with filtering and pagination.
- **Deployment Strategy**: Frontend builds optimized static assets, backend bundles server code. Utilizes `tsx` for development and serves static files from Express for production.

## External Dependencies

### Data Sources & APIs
- **Google Play Store**: Scraped using Python libraries.
- **Apple App Store**: Scraped via RSS feeds.
- **Naver Blog**: Integrated via Naver API and web scraping for content.
- **Naver Cafe**: Integrated via Naver API and web scraping for content.
- **OpenAI API**: Used for GPT-4o-mini for sentiment analysis and GPT-4o for advanced HEART framework UX analysis and keyword extraction.

### Frontend Dependencies
- **React 18**: UI framework.
- **Radix UI primitives & shadcn/ui**: Component library for UI elements.
- **TanStack Query**: For server state management and data fetching.
- **Tailwind CSS**: For styling and custom design system.
- **date-fns**: For date manipulation.
- **React Hook Form with Zod**: For form handling and validation.
- **React Font Awesome**: For professional icons.

### Backend Dependencies
- **Drizzle ORM**: For database interactions with PostgreSQL.
- **Zod**: For schema validation.
- **connect-pg-simple**: For PostgreSQL session management.
- **Node.js with Express.js**: Server runtime and framework.
- **Python Libraries**: `google-play-scraper`, `feedparser`, `requests`, `BeautifulSoup4`, `wordcloud`, `matplotlib`, `konlpy`, `NetworkX`, `transformers` (for KcELECTRA model).

### Development & Deployment Tools
- **Vite**: Frontend build tool.
- **esbuild**: Backend bundling.
- **Replit**: Development environment integration.
- **Drizzle Kit**: For database schema migrations.
- **Neon Database**: Serverless PostgreSQL database provider.