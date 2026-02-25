# Replit.md - Gold Home Cleaning Management System

## Overview
This project, "Gold Home Cleaning Management System," is a full-stack application designed to streamline operations for cleaning services. It enables supervisors to efficiently manage cleaning teams, track invoices, monitor live locations of staff, and oversee overall operations through a comprehensive dashboard. The system aims to enhance productivity and management capabilities within the cleaning industry.

## User Preferences
Preferred communication style: Simple, everyday language.
Default location: 34.6220955, 45.3088178 (Kalar, Kurdistan, Iraq)
Location behavior: Auto-set to Kalar coordinates when user logs in
Map preference: Use fixed Kalar location, no manual GPS buttons
Currency: Iraqi Dinar (IQD) formatting throughout the system
Protected pages: Services, Team, and Admin Panel pages should not be modified

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript.
- **Routing**: Wouter.
- **UI/UX**: Radix UI components styled with shadcn/ui and Tailwind CSS, featuring a custom gold, purple, and blue color palette, gradient backgrounds, glass-morphism effects, and modern typography. Includes mobile-first responsive design.
- **State Management**: TanStack Query for server state; local context for authentication.
- **Build Tool**: Vite.

### Backend
- **Framework**: Express.js with TypeScript.
- **Database**: PostgreSQL with Drizzle ORM.
- **Session Management**: Connect-pg-simple for PostgreSQL sessions.
- **API Design**: RESTful with JSON responses.
- **Authentication**: Simple session-based, role-based (cleaner/supervisor) authentication.
- **Performance Optimization**: 
  - In-memory caching system for frequently accessed endpoints (30-60s TTL)
  - Database connection pooling (max 10 connections, 30s idle timeout)
  - Comprehensive cache invalidation on all data mutations
  - Reduced WebSocket location broadcast frequency (10s intervals)

### Data Storage & Schema
- **Primary Database**: PostgreSQL (Neon serverless).
- **ORM**: Drizzle ORM with Zod validation.
- **Migrations**: Drizzle Kit.
- **Tables**:
    - **Users**: Stores cleaner and supervisor accounts with roles, avatars, active status.
    - **Invoices**: Tracks customer jobs with amounts, service types, photos, completion status. Supports multi-service invoices.
    - **Locations**: Real-time GPS tracking of team members and work status.
    - **user_settings**: Stores per-user permission controls.
    - **Services**: Stores details for various cleaning services (pricing, descriptions).
    - **cloudflare_config**: Stores Cloudflare API credentials (token, zone ID, zone name).
    - **cloudflare_dns_records**: Cached DNS records synced from Cloudflare API.

### Core Features
- **Authentication System**: Role-based access, session management, protected routes, automatic logout. Includes unified authentication for customers and staff.
- **Dashboard**: Revenue and job statistics, recent invoices, team status, location tracking, active cleaner count.
- **Invoice Management**: Creation with customer details, service types, photo attachments, status tracking, PDF export (individual and bulk). Currency standardized to Iraqi Dinar (IQD).
- **Team Management**: View team members, track individual earnings/job counts, monitor active/working status.
- **Live Tracking**: Complete real-time location monitoring system with WebSocket connections, automatic location sharing on cleaner login, dedicated live tracking page, and fallback coordinate-based mapping when Google Maps API is not configured.
- **Notification System**: Comprehensive system for admin/supervisors for new customer bookings.
- **Settings System**: Granular, user-specific permission controls for enabling/disabling pages/components, restricted to supervisors.
- **User Permission Management**: Comprehensive admin interface for setting granular user permissions to control access to different sections and features of the system. Includes role-based defaults and individual permission overrides.
- **Analytics**: Enhanced dashboard with reporting, date filtering, and CSV export.
- **Loading Animations**: Interactive and comprehensive loading animations using `framer-motion` for system startup and various user interactions.
- **Customer Booking System**: Full workflow from customer booking → admin assignment → work completion → automatic invoice generation.
- **Automatic Invoice Creation**: When a booking status changes to "completed", the system automatically creates an invoice and sends notifications to the assigned cleaner and administrators.
- **Live Location Tracking System**: Real-time GPS tracking with WebSocket connections, automatic activation when staff login, customer tracking pages, and coordinate-based location display with Google Maps fallback.
- **Customer Location Mapping**: Dedicated page showing customer locations from booking requests on an interactive map, helping team members navigate to customers. Includes filtering by booking status, detailed booking information, and direct navigation links to Google Maps.
- **Booking Auto-Location Detection**: Integrated geolocation API for automatic location detection in booking forms with "Detect Current Location" button and fallback to default Kalar location.
- **Edit Booking Functionality**: Complete edit system for assigned bookings allowing service modifications for invoice management, with add/remove service capabilities.
- **Role-Based Booking Visibility**: Implemented role-based access where cleaners only see bookings assigned to them, while admins see all bookings. Cleaners can complete their assigned jobs but cannot assign, edit, or delete bookings.
- **Beautiful Minimal Customer Dashboard**: Complete redesign with modern tab-based navigation (Overview, Book Service, My Bookings, Profile), animated stats cards, clean card layouts, and professional mobile footer navigation menu with tap animations and booking count badges.
- **Cloudflare DNS Management**: Integrated Cloudflare API for managing DNS records directly from the admin panel. Features include configuration setup, DNS record listing, creation, editing, and deletion with proxy status controls. Admin-only access with secure API token handling.

## External Dependencies

- **@neondatabase/serverless**: PostgreSQL serverless database connection.
- **drizzle-orm**: TypeScript ORM for database operations.
- **@tanstack/react-query**: Server state management and caching.
- **@radix-ui/**: Headless UI component primitives.
- **react-hook-form**: Form validation and management.
- **zod**: Schema validation for type safety.
- **mapbox-gl-js**: For professional-grade mapping and location visualization.
- **framer-motion**: For interactive loading animations and UI transitions.