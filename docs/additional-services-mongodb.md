# Additional Services MongoDB Implementation

This document describes the MongoDB implementation that replaces the localStorage-based "additionalServicesState" system.

## Overview

The additional services system has been migrated from localStorage to MongoDB for better data persistence, scalability, and management. The system includes:

- **Additional Services**: Core service definitions with video content
- **Activation Requests**: User requests to activate services
- **Cancellation Requests**: User requests to cancel active services  
- **User Subscribed Services**: User-specific service subscriptions

## MongoDB Models

### AdditionalService
- **Collection**: `additionalservices`
- **Fields**:
  - `name`: Service name
  - `paymentLink`: Payment/purchase URL
  - `addServiceButtonText`: Customizable button text
  - `activateServiceButtonText`: Customizable button text
  - `cancelServiceButtonText`: Customizable button text
  - `videoES`: Spanish video data (title, sourceType, url)
  - `videoEN`: English video data (title, sourceType, url)
  - `active`: Boolean status

### ActivationRequest
- **Collection**: `activationrequests`
- **Fields**:
  - `userId`: Firebase user ID
  - `userName`: User's full name
  - `userEmail`: User's email
  - `serviceId`: Reference to AdditionalService
  - `serviceName`: Service name (denormalized)
  - `status`: 'pending' | 'approved' | 'rejected'

### CancellationRequest
- **Collection**: `cancellationrequests`
- **Fields**:
  - `userId`: Firebase user ID
  - `userName`: User's full name
  - `userEmail`: User's email
  - `serviceId`: Reference to AdditionalService
  - `serviceName`: Service name (denormalized)
  - `status`: 'pending' | 'processed'

### UserSubscribedService
- **Collection**: `usersubscribedservices`
- **Fields**:
  - `userId`: Firebase user ID
  - `serviceId`: Reference to AdditionalService
  - `status`: 'pending_activation' | 'active' | 'pending_cancellation'
  - `activatedAt`: Date when service was activated

## API Endpoints

### Additional Services
- `GET /api/additional-services` - Fetch all services
- `POST /api/additional-services` - Create new service
- `PUT /api/additional-services/[id]` - Update service
- `DELETE /api/additional-services/[id]` - Delete service

### Activation Requests
- `GET /api/activation-requests` - Fetch all activation requests
- `POST /api/activation-requests` - Create activation request
- `PUT /api/activation-requests/[id]` - Update request status
- `DELETE /api/activation-requests` - Reset all requests

### Cancellation Requests
- `GET /api/cancellation-requests` - Fetch all cancellation requests
- `POST /api/cancellation-requests` - Create cancellation request
- `PUT /api/cancellation-requests/[id]` - Update request status
- `DELETE /api/cancellation-requests` - Reset all requests

### User Services
- `GET /api/user-services?userId=...` - Fetch user's services
- `POST /api/user-services` - Create user service
- `PUT /api/user-services` - Update user service status

### Database Seeding
- `POST /api/seed-services` - Initialize database with default services

### File Upload
- `POST /api/upload` - Upload files (for video content)

## Utility Functions

The `/src/lib/additional-services.ts` file provides utility functions:

- `fetchAdditionalServices()` - Get all services
- `createAdditionalService()` - Create new service
- `updateAdditionalService()` - Update existing service
- `deleteAdditionalService()` - Delete service
- `fetchActivationRequests()` - Get activation requests
- `createActivationRequest()` - Create activation request
- `updateActivationRequestStatus()` - Update request status
- `fetchCancellationRequests()` - Get cancellation requests
- `createCancellationRequest()` - Create cancellation request
- `updateCancellationRequestStatus()` - Update cancellation status
- `fetchUserServices()` - Get user's services
- `updateUserService()` - Update user service
- `createUserService()` - Create user service

## File Upload Integration

The system now uses the `FileUploadDialog` component for video file uploads:

- Files are uploaded to `/public/uploads/` directory
- Generates unique filenames with timestamps
- Returns file URL for database storage
- Supports video file types for service content

## Migration Notes

### Before (localStorage)
- Data stored in browser localStorage
- Keys: `additionalServicesState`, `serviceActivationRequestsState`, etc.
- Data lost when clearing browser storage
- No server-side validation

### After (MongoDB)
- Data persisted in MongoDB Atlas
- Server-side validation and error handling
- Scalable for multiple users
- RESTful API architecture
- Type-safe operations with TypeScript

## Initial Data

The database is seeded with 11 default services:
1. Sistema de Marketing
2. Sistema de Escaneo
3. Manejo de Gastos e Ingresos
4. Sistema de Incentivos
5. EZ Perfil Store
6. EZ Perfil Servicios Locales
7. EZ Perfil Business Card
8. EZ Perfil E Courses
9. EZ Perfil Prestamos y Credit Repair
10. EZ Perfil Vittual Asistant
11. EZ Perfil Social Media Management

## Error Handling

All API operations include proper error handling with:
- Try-catch blocks in handlers
- User-friendly toast notifications
- Console logging for debugging
- Graceful fallbacks

## Testing

Use the seed endpoint to initialize test data:
```bash
curl -X POST http://localhost:3000/api/seed-services
```

The implementation maintains backward compatibility with the existing UI while providing enhanced data persistence and management capabilities.
