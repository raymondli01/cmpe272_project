# A.W.A.R.E. - Agent for Water Autonomy, Resilience, and Efficiency

A.W.A.R.E. is a proactive, self-healing AI agent designed for intelligent water utility management. This project was created for the **CMPE-272: Enterprise Software Platforms** course at **San Jose State University (Fall 2025)**.

## Table of Contents

1. [Problem Statement](#1-the-problem)
2. [Solution Overview](#2-our-solution-an-agentic-approach)
3. [Key Features](#3-key-features)
4. [Tech Stack](#tech-stack)
5. [Installation & Usage](#installation--usage)
6. [Project Resources](#project-resources)
7. [Project Deliverables](#project-deliverables)
8. [Project Team](#project-team)

---

## 1. The Problem

Municipal water networks are critical yet fragile infrastructures. They face constant threats from aging pipes, unexpected leaks, potential contamination, and massive energy consumption. Current management systems are almost entirely **reactive**, addressing failures only _after_ they have caused significant water loss, service disruption, and potential public health risks.

## 2. Our Solution: An Agentic Approach

A.W.A.R.E. is a proactive control system built on a **digital twin** of a municipal water network. It leverages a multi-agent AI to monitor the network in real-time, predict failures before they occur, and take autonomous actions to ensure the system remains resilient, safe, and efficient. It shifts the paradigm from reactive maintenance to **proactive, self-healing orchestration**.

## 3. Key Features

- 💧 **Proactive Leak Pre-emption:** Analyzes acoustic and pressure data to detect and locate pipe fissures _before_ they burst. Autonomously isolates compromised sections by controlling smart valves, minimizing water loss and preventing service outages.
- ⚡ **Dynamic Energy Optimization:** Forecasts water demand and monitors the real-time electricity price grid to shift energy-intensive operations (like filling reservoirs) to off-peak hours, drastically reducing operational costs.
- 🗺️ **Real-time Network Visualization:** A comprehensive dashboard provides human operators with a live, intuitive view of the entire network's health, the agent's actions, and key performance indicators.
- 🛑 **Autonomous Visual Isolation:** When a leak is detected, the agent automatically updates the status of the pipe in the system, triggering a real-time visual change on the network dashboard.

---

## Tech Stack

| Layer        | Technology                                                                                                                                                                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend** | ![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)                                                                      |
| **Backend**  | ![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white) ![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white) ![JSON](https://img.shields.io/badge/JSON-000000?logo=json&logoColor=white) |

---

## Installation & Usage

```bash
# Backend Setup Instructions

# 1. Change to the backend directory
cd backend

# 2. Create a Python virtual environment
python -m venv venv

# 3. Activate the virtual environment (Windows)
venv\Scripts\activate

#    (On macOS/Linux, use: source venv/bin/activate)

# 4. Upgrade pip and install all requirements
python -m pip install --upgrade pip && pip install -r requirements.txt --verbose

# 5. Start the FastAPI development server using Uvicorn
uvicorn main:app --reload
```

```bash
# Frontend Setup Instructions

# 1. Change to the frontend directory
cd frontend

# 2. Install all required Node.js packages
npm install

# 3. Start the React development server
npm start
```

You can access the dashboard at [http://localhost:3000](http://localhost:3000) once the frontend is running.

The backend API will be available at [http://localhost:8000](http://localhost:8000) when the FastAPI server is started.

---

## Project Resources

| Resource          | Link                                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| Presentation Info | [Presentation Schedule & Details](https://sjsu.instructure.com/courses/1611826/discussion_topics/5664800) |

## Project Deliverables

| Deliverable    | Link                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------- |
| GitHub Code    | [GitHub Code Submission](https://sjsu.instructure.com/courses/1611826/assignments/7540441)    |
| Live Demo      | [Live Demo Submission](https://sjsu.instructure.com/courses/1611826/assignments/7540440)      |
| Project Report | [Project Report Submission](https://sjsu.instructure.com/courses/1611826/assignments/7540435) |

---

## Project Team

**Team Name:** A.W.A.R.E

**Members:**

- Raymond Li
- Sophia Atendido
- Jack Liang
- Dhruv Verma
