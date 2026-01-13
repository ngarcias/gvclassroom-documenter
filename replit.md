# GVClassroom

## Overview

GVClassroom is a student attendance control platform for educational institutions. It manages classes, devices, rooms (salas), and attendance reports in a centralized way. The system supports multiple user roles (SuperAdmin, Professor, Viewer) with permission-based access control, device monitoring and homologation, calendar views for classes, and comprehensive reporting features.

The platform is built as a full-stack TypeScript application with a React frontend and Express backend, using PostgreSQL for data persistence through Prisma ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens defined in CSS variables
- **Form Handling**: React Hook Form with Zod validation
- **Design System**: Material Design + Enterprise Dashboard patterns per design_guidelines.md

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful JSON API under `/api` prefix
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Database ORM**: Prisma Client with PostgreSQL adapter
- **Build System**: Vite for frontend, esbuild for server bundling

### Data Layer
- **Database**: PostgreSQL (required, configured via DATABASE_URL environment variable)
- **ORM**: Prisma with generated client in `generated/prisma/`
- **Schema Location**: `prisma/schema.prisma` (Prisma) and `shared/schema.ts` (Zod validation)
- **Migrations**: Managed via Prisma migrations in `prisma/migrations/`

### Key Domain Models
- **Sede**: Campus/location with timezone support
- **Sala**: Classroom within a sede
- **Usuario**: Users with RUT-based identification, roles (profesor/alumno/admin), and profile-based permissions
- **Perfil**: Permission profiles with granular access control
- **Clase**: Class sessions with scheduling and attendance tracking
- **Dispositivo**: Attendance tracking devices (tablets/PDAs) with connection monitoring
- **Marcaje**: Individual attendance records (present/absent/late/justified)
- **IncidenciaDispositivo**: Device incident tracking and homologation

### Authentication & Authorization
- JWT tokens stored client-side with Bearer authentication
- Permission-based access control through Perfil system
- Permissions stored as comma-separated strings in Perfil.permisos field
- Auth context provider manages user state across the React app

### Project Structure
```
client/           # React frontend application
  src/
    components/   # UI components (shadcn/ui based)
    contexts/     # React contexts (auth)
    hooks/        # Custom hooks
    pages/        # Route pages
    lib/          # Utilities and query client
server/           # Express backend
  routes.ts       # API route definitions
  db.ts           # Prisma client singleton
shared/           # Shared types and schemas
prisma/           # Prisma schema and migrations
generated/prisma/ # Generated Prisma client
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via DATABASE_URL environment variable
- **Prisma**: ORM with @prisma/adapter-pg for PostgreSQL connectivity

### Authentication
- **jsonwebtoken**: JWT token generation and verification
- **bcryptjs**: Password hashing

### UI/Frontend Libraries
- **@radix-ui/***: Headless UI primitives for accessible components
- **@tanstack/react-query**: Server state management
- **date-fns**: Date manipulation with Spanish locale support
- **lucide-react**: Icon library
- **react-day-picker**: Calendar component
- **react-hook-form**: Form state management
- **zod**: Schema validation (shared between client and server)

### Build Tools
- **Vite**: Frontend development server and bundler
- **esbuild**: Server-side bundling for production
- **tsx**: TypeScript execution for development

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: JWT signing secret (defaults to fallback in development)