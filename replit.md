# Overview

This is a Laboratory Information Management System (LIMS) portal built as a full-stack web application. The system manages the entire workflow of genetic testing services, from lead generation and sample tracking to lab processing, bioinformatics analysis, and report delivery. It serves different user roles including sales teams, operations staff, lab technicians, bioinformatics specialists, finance teams, and administrators.

The application handles the complete lifecycle of genetic testing samples: quote generation for potential clients, sample collection logistics, laboratory processing workflows, data analysis pipelines, report generation, and financial management. The system provides role-based access control to ensure users only see relevant functionality for their position.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is built with React and TypeScript using Vite as the build tool. The UI framework is based on shadcn/ui components with Radix UI primitives and styled with Tailwind CSS. The application uses Wouter for client-side routing and TanStack Query for server state management. The design system implements a professional theme with CSS variables for consistent styling across components.

The frontend follows a component-based architecture with clear separation between pages, reusable UI components, and business logic. Authentication state is managed through React Context, providing role-based access control throughout the application. The layout includes a responsive sidebar navigation and top bar with user management features.

This file is intentionally left blank.
- **Drizzle ORM**: Type-safe database queries and migrations with PostgreSQL dialect support

## UI Component Libraries
- **Radix UI**: Unstyled, accessible UI primitives for complex components like dialogs, dropdowns, and form controls
- **shadcn/ui**: Pre-built component library built on top of Radix UI with consistent design patterns
- **Tailwind CSS**: Utility-first CSS framework for responsive design and consistent styling

## Development Tools
- **Vite**: Fast build tool with hot module replacement and optimized production builds
- **TypeScript**: Static type checking across the entire application stack
- **React**: Component-based UI library with hooks and context for state management

## Authentication & Security
- **bcrypt**: Password hashing for secure user authentication
- **Zod**: Runtime type validation for API inputs and form validation

## Utility Libraries
- **TanStack Query**: Server state management with caching, synchronization, and background updates
- **React Hook Form**: Performant form library with validation integration
- **date-fns**: Date manipulation and formatting utilities
- **Wouter**: Lightweight client-side routing for single-page application navigation