# CSR2 Local Environment & Save State Utility

A local web-based utility for managing save states, asset databases, and binary configurations for the Google Play Games Developer Emulator (GPGDE).

This repository provides a React frontend and a Python backend to process local files. 

## Prerequisites
Before setting up the tool, ensure you have the following installed on your PC:
- [Node.js](https://nodejs.org/) (LTS version recommended)
- [Python 3.9+](https://www.python.org/downloads/)
- Git

---

## Part 1: Repository Setup

1. **Clone the repository:**
   Open your terminal (PowerShell or Command Prompt) and run:
   `git clone https://github.com/KibbIes/csr2-tool.git`
   `cd csr2-tool`

2. **Ensure required files are present:**
   The backend requires a `all_cars.txt` file to generate the asset ledger. Ensure this file is located in the `backend/` folder. 

---

## Part 2: Running the Python Backend

The backend handles the file unpacking, database injection, and binary patching. It runs locally on port `8000`.

1. Open a new terminal and navigate to the backend folder:
   `cd backend`

2. (Optional but recommended) Create a virtual environment:
   `python -m venv venv`
   `.\venv\Scripts\activate`

3. The backend uses only standard Python libraries (`http.server`, `gzip`, `hashlib`, `hmac`, `json`). There are no external `pip` packages required.

4. Start the backend server:
   `python backend.py`

   You should see: `Starting server on port 8000...`
   Keep this terminal window open and running.

---

## Part 3: Running the React Frontend

The frontend provides the web interface, file uploads, and the built-in 16-step guide.

1. Open a **new** terminal window and navigate to the root folder (`csr2-tool`).

2. Install the Node dependencies (only required the first time):
   `npm install`

3. Start the Vite development server:
   `npm run dev`

4. Open your web browser and navigate to the local address provided in the terminal (usually `http://localhost:5173`).

---

## Usage

Once both the backend and frontend are running:
1. Use the web interface to upload your original baseline files (`nsb`, `scb`, and `libil2cpp.so`).
2. Input your Player ID.
3. Click **Generate Files** to download the processed files.
4. Click the **View Full 16-Step Installation Tutorial** button inside the web tool for the exact ADB commands required to deploy the files to your emulator.

## Disclaimer
This tool is provided for educational and local environment management purposes only. It is not affiliated with, endorsed by, or associated with Zynga or NaturalMotion. Use at your own risk.
