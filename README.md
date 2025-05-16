# MediTech Healthcare Blockchain DMS

A modern Digital Medical System (DMS) built with React frontend and Node.js backend, leveraging blockchain technology for secure patient record management.

## Project Overview

MediTech is a healthcare application that utilizes blockchain technology to securely store and manage patient medical records. The application provides:

- Secure authentication system
- Patient record management
- Blockchain-backed data integrity
- IPFS-powered distributed storage
- Modern, responsive UI

## Technology Stack

### Frontend
- React.js
- Material-UI for components
- React Router for navigation
- Axios for API communication

### Backend
- Node.js
- Express.js
- MongoDB for database
- JWT for authentication
- Blockchain integration (Ethereum/Sepolia)
- IPFS integration (via Pinata)

## Getting Started

### Prerequisites
- Node.js (v14+)
- npm or yarn
- MongoDB (for production use)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd healthcareblockchain
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend-react
npm install
```

4. Set up environment variables:
   - Create `.env` file in the backend directory (see `.env.example`)
   - Create `.env` file in the frontend-react directory (see `.env.example`)

### Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend application:
```bash
cd frontend-react
npm start
```

3. Access the application at: http://localhost:3000

## Features

### Authentication
- User registration and login
- JWT-based authentication
- Role-based access control (Admin, Doctor, Patient)

### Patient Management
- Create, view, update, and delete patient records
- Search and filter patient data
- Medical history tracking

### Medical Records
- Secure storage with blockchain verification
- IPFS-based decentralized file storage
- Record access control and permissions
- Audit trail of record access

### Dashboard
- Overview of key metrics
- Recent activity tracking
- Quick access to common functions

## Demo Mode

The application features a robust demo mode that works without:
- MongoDB connection
- Blockchain connection
- IPFS connection

This allows for easy testing and development without requiring full infrastructure setup.

### How Demo Mode Works

1. **Automatic Detection**: The application automatically detects if the backend is available when it starts up.

2. **Manual Toggle**: Users can toggle between Demo Mode and Connected Mode using the indicator in the app header.

3. **Pre-filled Credentials**: In Demo Mode, the login form is pre-filled with demo credentials (email: `demo@meditech.com`, password: `demo123`).

4. **Mock Data**: All API calls are intercepted and return realistic mock data to simulate a fully functional application.

5. **Connection Recovery**: The application periodically attempts to reconnect to the backend. Users can also manually retry the connection.

### When to Use Demo Mode

- During development when you don't want to set up the full backend infrastructure
- For presentations and demonstrations
- When traveling or in environments with limited connectivity
- For testing UI and frontend functionality in isolation

### Visual Indicators

The application provides clear visual indicators for the current mode:
- A status chip in the header showing "Demo Mode" or "Connected"
- Alert notifications on the login screen when in Demo Mode
- Informational popups explaining the current mode

## Project Structure

```
healthcareblockchain/
├── backend/                # Node.js server
│   ├── controllers/        # API controllers
│   ├── middleware/         # Express middleware
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   ├── services/           # Business logic services
│   ├── .env                # Environment variables
│   ├── package.json        # Backend dependencies
│   └── server.js           # Entry point
│
└── frontend-react/         # React frontend
    ├── public/             # Static files
    ├── src/                
    │   ├── components/     # Reusable components
    │   ├── layouts/        # Page layouts
    │   ├── pages/          # Application pages
    │   ├── services/       # API services
    │   ├── App.js          # Main App component
    │   └── index.js        # Entry point
    ├── .env                # Environment variables
    └── package.json        # Frontend dependencies
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Material-UI for the component library
- IPFS/Pinata for decentralized storage
- Ethereum/Sepolia for blockchain infrastructure 