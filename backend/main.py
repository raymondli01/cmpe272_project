import fastapi
import fastapi.middleware.cors
import random

app = fastapi.FastAPI()

# Middleware Configuration
app.add_middleware(
    fastapi.middleware.cors.CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Root Endpoint
@app.get("/")
def read_root():
    return {"status": "ok", "message": "AWARE Water Management System API"}


# Sensor Data Simulation
@app.get("/sensors")
def get_sensors():
    """
    Generate synthetic sensor data for 10 pipes.
    Each pipe includes pressure and acoustic readings.
    """
    pipes = []
    for i in range(1, 11):
        pipes.append(
            {
                "pipe_id": f"P-{i}",
                "pressure": round(random.uniform(40, 100), 2),
                "acoustic": round(random.uniform(0, 1), 2),
            }
        )
    return {"pipes": pipes}


# Leak Detection Logic
@app.get("/leaks")
def get_leaks():
    """
    Identify pipes with possible leaks based on simulated sensor data.
    Leak criteria: pressure < 60 psi and acoustic > 0.7.
    """
    pipes = []
    for i in range(1, 11):
        pressure = round(random.uniform(40, 100), 2)
        acoustic = round(random.uniform(0, 1), 2)
        leak = pressure < 60 and acoustic > 0.7
        pipes.append(
            {
                "pipe_id": f"P-{i}",
                "pressure": pressure,
                "acoustic": acoustic,
                "leak": leak,
            }
        )
    leaks = [pipe for pipe in pipes if pipe["leak"]]
    return {"leaks": leaks}
