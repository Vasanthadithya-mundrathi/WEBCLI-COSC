# Web CLI Terminal

A fullstack web-based command-line terminal application.

## Project Structure

- `frontend/`: React-based web client
- `backend/`: Python backend server

## Getting Started

### Prerequisites

- Node.js (for frontend)
- Python 3.x (for backend)
- Yarn (for frontend package management)

### Frontend

```bash
cd frontend
yarn install
yarn start
```

The frontend will run on [http://localhost:3000](http://localhost:3000) or the next available port.

### Backend

```bash
cd backend
pip install -r requirements.txt
python server.py
```

The backend will run on the port specified in `.env`.

## Deployment

To deploy on Render:

1. Push this repository to GitHub.
2. Connect your repo to Render and set up separate services for frontend and backend as needed.
3. Configure environment variables in Render dashboard.

## License

MIT
