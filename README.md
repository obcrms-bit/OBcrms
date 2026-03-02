# Trust Education CRM & ERP 🚀

An enterprise-grade, multi-tenant CRM and ERP system designed specifically for Education Consultancies. This project features a robust Node.js backend and a modern React frontend, focused on lead management, student application tracking, and automated invoicing.

## 🌟 Key Features

-   **Multi-Tenancy**: Secure isolation of data between different consultancy companies.
-   **Lead Management**: Track inquiries from various sources (Website, Social Media, Walk-ins).
-   **Student CRM**: Comprehensive student profiles with academic history, test scores, and document tracking.
-   **Application Tracking**: Manage university applications across different countries and intakes.
-   **Automated Invoicing**: Generate PDF invoices and send them directly to students via email.
-   **Role-Based Access Control (RBAC)**: Distinct permissions for Admins, Counselors, Sales, Managers, and Accountants.
-   **Graceful Production Ready**: Optimized for deployment on Render (Backend) and Vercel (Frontend).

---

## 🛠️ Technology Stack

### Backend
-   **Engine**: Node.js (v18+)
-   **Framework**: Express.js
-   **Database**: MongoDB (via Mongoose)
-   **Security**: JWT Authentication, Helmet, Bcrypt
-   **Utilities**: Nodemailer (Email), PDFKit (Invoices), Morgan (Logging), Compression

### Frontend
-   **UI Library**: React.js (v18+)
-   **Styling**: Tailwind CSS
-   **Icons**: Lucide React
-   **Routing**: React Router DOM (v6)
-   **State/API**: Context API & Axios

---

## 📂 Project Structure

```bash
├── Backend/                 # Express API
│   ├── controllers/         # Business logic
│   ├── models/              # MongoDB schemas
│   ├── routes/              # API endpoints
│   ├── middleware/          # Auth & Tenant isolation
│   ├── utils/               # PDF & Email services
│   └── constants/           # Workflow definitions
├── Frontend/                # React Application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # Auth & Branding state
│   │   ├── services/        # API communication
│   │   └── pages/           # View components
│   └── public/              # Static assets
└── package.json             # Root workspace configuration
```

---

## ⚙️ Local Setup

### 1. Prerequisites
-   Node.js (v18 or higher)
-   MongoDB instance (local or Atlas)

### 2. Installation
From the root directory:
```bash
npm run postinstall
```

### 3. Environment Configuration
Create a `.env` file in the `Backend/` directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/trust-crm
JWT_SECRET=your_super_secret_key
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 4. Running the App
-   **Run Backend**: `npm run dev:backend`
-   **Run Frontend**: `npm run dev:frontend`

---

## 🚀 Deployment

### Backend (Render)
1.  Connect your repository to Render.
2.  Set **Root Directory** to `Backend`.
3.  **Build Command**: `npm install`
4.  **Start Command**: `npm start`
5.  Add all required Environment Variables (see `.env.example`).

### Frontend (Vercel)
1.  Connect your repository to Vercel.
2.  Set **Root Directory** to `Frontend`.
3.  Set **Framework Preset** to `Create React App`.
4.  **Build Command**: `npm run build`
5.  Set `REACT_APP_API_URL` to your Render API URL (e.g., `https://api.yourdomain.com/api`).

---

## ⚖️ License
Licensed under **ISC License**. Created for Trust Education.
