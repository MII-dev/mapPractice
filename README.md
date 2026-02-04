# Map Practice Project 🌍

A modern full-stack application for visualizing regional data in Ukraine using React, Leaflet, Express, and PostgreSQL, all orchestrated with Docker.

## 🚀 Features
- **Interactive Map**: Displays regions of Ukraine with dynamic coloring based on data.
- **Side Panel**: Detailed information about the selected region.
- **Dual Data Sources**: 
  - Real-time data synchronization from **Google Sheets API**.
  - Local persistence and management using **PostgreSQL**.
- **Containerized**: Fully dockerized development environment for easy setup.

## 🛠 Tech Stack
- **Frontend**: React, TypeScript, Vite, Leaflet, Bootstrap.
- **Backend**: Node.js, Express.
- **Database**: PostgreSQL.
- **DevOps**: Docker, Docker Compose.

## 📁 Project Structure
```text
.
├── backend/              # Node.js Express server
│   ├── Dockerfile.dev    # Docker configuration for backend
│   └── index.js          # API entry point
├── react-app/            # Frontend React application
│   ├── src/
│   │   ├── components/   # Map, Sidebar, and API components
│   │   └── App.tsx       # Main component
│   └── Dockerfile.dev    # Docker configuration for frontend
└── docker-compose.yml    # Main orchestration file
```

## ⚙️ Setup & Running

### Prerequisites
- Docker & Docker Compose installed on your machine.

### Execution
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/MII-dev/mapPractice.git
    cd mapPractice
    ```

2.  **Start the environment**:
    ```bash
    docker-compose up --build
    ```

3.  **Access the application**:
    - Frontend: [http://localhost:5173](http://localhost:5173)
    - Backend API: [http://localhost:3001/api/regions](http://localhost:3001/api/regions)

## 🗄 Database Configuration
The database is automatically started by Docker. 
- **DB Name**: `map_data`
- **User**: `postgres`
- **Password**: `Lambada`

> [!NOTE]
> Ensure you have the `regions` table in your `map_data` database if you want local data to appear. The backend expects columns: `name`, `total`, `vacancies`, `rating`, `id_1`.

## 📄 Documentation & Work Progress
Detailed implementation plans and task lists can be found in the `.gemini/antigravity/brain/` directory (if accessible).
