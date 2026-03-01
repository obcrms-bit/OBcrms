# AI Copilot Instructions for trust-education-crm-erp

## Project Overview
Enterprise Education CRM/ERP system for consultancies featuring multi-branch support, AI lead scoring, commission tracking, and WhatsApp/SMS automation. Currently in early development with core CRUD APIs implemented.

## Architecture & Key Patterns

### Backend Stack
- **Runtime**: Node.js with CommonJS modules (`"type": "commonjs"` in package.json)
- **API Framework**: Express 5.2.1 with CORS enabled for frontend communication
- **Database**: MongoDB via Mongoose 9.2.2 for schema validation and ODM
- **Configuration**: dotenv for environment variables (MONGO_URI, PORT)

### Project Structure
```
Backend/
  server.js              # Express app initialization, route mounting, DB connection
  models/                # Mongoose schemas (Student, Application, Lead, Commission)
  routes/                # Express Router instances (CRUD endpoints)
  utils/
    responseHandler.js   # Standardized success/error response helpers
  package.json           # Dependencies: express, mongoose, cors, dotenv
  .env                   # MongoDB connection and port configuration
Frontend/                # Not yet initialized - framework TBD
```

### Data Models
- **Student**: name, email (unique), phone, course, status, timestamps
- **Application**: studentId (ref), courseApplied, status (pending/approved/rejected), timestamps
- **Lead**: name, email, phone, source, status, aiScore, interestedCourse, timestamps
- **Commission**: agentId, leadId (ref), studentId (ref), amount, status (pending/approved/paid), timestamps

### Standardized Response Format

**Success (all status codes):**
```json
{
  "success": true,
  "message": "Operation completed",
  "data": {}  // optional, included when returning data
}
```

**Error (all status codes):**
```json
{
  "success": false,
  "message": "User-facing error message",
  "error": "Optional technical details"  // optional
}
```

Import and use `{ sendSuccess, sendError }` from `utils/responseHandler.js` in all route handlers.

### Route Registration Pattern
1. Create model file in `models/{Resource}.js` with Mongoose schema
2. Create router in `routes/{resource}Routes.js` with CRUD handlers using responseHandler
3. Import and mount in `server.js`: `app.use("/api/resource", resourceRoutes)`
4. Test via HTTP to `http://localhost:5000/api/resource`

## Developer Workflows

### Starting the Backend
```bash
cd Backend
npm install
# Create .env with: MONGO_URI=mongodb://localhost:27017/trust-education
node server.js
```

Expected output:
```
✅ MongoDB Connected Successfully
🚀 Server running on port 5000
```

### Testing Endpoints
- **GET** `http://localhost:5000/api/students` - Retrieve all students
- **POST** `http://localhost:5000/api/students` - Create student (requires: name, email)
- **GET** `http://localhost:5000/api/students/:id` - Get single student
- **PUT** `http://localhost:5000/api/students/:id` - Update student
- **DELETE** `http://localhost:5000/api/students/:id` - Delete student

Same CRUD pattern applies to `/api/applications`, `/api/leads`, `/api/commissions`.

## Current Conventions & Known Issues

### Error Handling
- Use `try-catch` with `sendError` for consistent responses
- Mongoose validation errors caught and returned with proper status codes (400 for validation, 409 for duplicates, 404 for not found)
- Database connection errors exit process with `process.exit(1)` to indicate failed startup

### CORS Configuration
- Global CORS enabled - refine to specific origins before production

### Gaps to Address
- **No authentication/authorization**: All endpoints public (JWT planned after CRUD is stable)
- **No input validation middleware**: Validation at handler level currently
- **No comprehensive logging**: Consider winston/morgan for production
- **Frontend framework not chosen**: Coordinate tech stack decision

## Integration Points & Dependencies

### External Services (Planned)
- **WhatsApp/SMS Automation**: Webhook receiver endpoint TBD
- **AI Lead Scoring**: Update Lead.aiScore via ML service integration
- **Commission Tracking**: Track agent performance against Commission records
- **Analytics Dashboard**: Aggregate data from all models for reporting

### Development Commands
- Currently no build/watch scripts - add `npm run dev` (nodemon) if needed
- No test suite yet - add Jest when adding complex business logic

## Guidelines for Contributors

1. **Models**: Include field validation, required constraints, and timestamps on all new models
2. **Routes**: Wrap all async handlers in try-catch, use responseHandler for consistency
3. **Error Responses**: Return user-friendly messages, include technical details only in error field
4. **Field Naming**: Use camelCase for all database fields and JSON responses
5. **References**: Use Mongoose population (`ref:` and `.populate()`) for relational data like studentId
6. **Status Fields**: Use enum constraints (e.g., "pending", "approved", "rejected") for state tracking
