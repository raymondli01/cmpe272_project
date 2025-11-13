# AWARE Water Management System - Backend

FastAPI backend for the AWARE Water Management System providing sensor data and leak detection endpoints.

## Features

- **Sensor Data Simulation**: Generate synthetic sensor data for 10 pipes with pressure and acoustic readings
- **Leak Detection**: Identify potential leaks based on pressure and acoustic thresholds
- **CORS Enabled**: Ready for frontend integration

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

## Installation

1. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Backend

Start the development server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- Main API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Alternative Docs: http://localhost:8000/redoc

## API Endpoints

### GET /
- **Description**: Health check endpoint
- **Response**: `{"status": "ok", "message": "AWARE Water Management System API"}`

### GET /sensors
- **Description**: Get simulated sensor data for all pipes
- **Response**: JSON array of pipe sensor data with pressure and acoustic readings

### GET /leaks
- **Description**: Get pipes with detected leaks
- **Leak Criteria**: pressure < 60 psi AND acoustic > 0.7
- **Response**: JSON array of pipes with leak indicators

## Development

To add new endpoints, edit `main.py` and follow the FastAPI patterns already established.

## Environment Variables

- `PORT`: Server port (default: 8000)
- `HOST`: Server host (default: 0.0.0.0)
