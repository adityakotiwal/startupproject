# GymSync Pro - Frontend Development Instructions

## Project Overview
GymSync Pro is a multi-tenant Gym Management SaaS application with a complete Supabase backend. The frontend is built using Next.js with TypeScript and Tailwind CSS.

## Technology Stack
- Framework: Next.js 14+ with App Router
- Language: TypeScript
- Styling: Tailwind CSS
- Backend: Supabase (supabase-js library)
- State Management: React Context + Hooks
- Charts: Recharts library
- Icons: Lucide React

## Architecture Principles
- Component-based architecture with reusable React components
- Modern React hooks for state management (useState, useEffect, useContext)
- Centralized Supabase client configuration
- Responsive design for desktop and mobile
- Proper error handling and loading states
- Row Level Security (RLS) enforced on backend

## Development Guidelines
- Use TypeScript for all components and utilities
- Follow Next.js App Router patterns
- Implement proper error boundaries
- Use async/await for all database operations
- Create reusable UI components in components/ directory
- Maintain consistent naming conventions
- Add proper TypeScript types for all API responses

## Project Structure
- `/app` - Next.js app router pages and layouts
- `/components` - Reusable React components
- `/lib` - Utilities, Supabase client, types
- `/contexts` - React context providers
- `/hooks` - Custom React hooks
- `/types` - TypeScript type definitions

## Authentication Flow
- Use AuthContext for global session management
- Implement protected routes with middleware
- Handle authentication redirects properly
- Store user session in Supabase auth

## API Integration
- All data operations through Supabase client
- Implement proper error handling for API calls
- Use React Query or SWR for data fetching optimization
- Handle loading and error states consistently