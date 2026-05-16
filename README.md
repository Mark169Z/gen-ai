# GenAI Font Generator

AI-powered handwriting font generator using:

* PyTorch
* FastAPI
* Potrace
* FontForge
* Next.js

The system generates:

* PNG glyph previews
* SVG vector glyphs
* Exportable `.ttf` font files

---

# Project Structure

```bash
genai/
├── backend/
├── frontend/
├── generated/
│   ├── png/
│   ├── svg/
│   └── fonts/
└── README.md
```

---

# Requirements

## Frontend

* Node.js 20+
* pnpm

## Backend

* Python 3.10+
* PyTorch
* Potrace
* FontForge

---

# Clone Repository

```bash
git clone <repo-url>

cd genai
```

---

# Frontend Setup

```bash
cd frontend

pnpm install
```

Create:

```bash
.env.local
```

Inside:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Run frontend:

```bash
pnpm dev
```

Frontend runs on:

```bash
http://localhost:3000
```

---

# Backend Setup

## Create Conda Environment

```bash
conda create -n ai-backend python=3.10

conda activate ai-backend
```

---

# Install PyTorch (CPU)

```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

---

# Install Python Dependencies

```bash
pip install fastapi uvicorn pillow python-multipart
```

---

# Install Potrace

Download:

* https://potrace.sourceforge.net/

After installation:

* locate `potrace.exe`

Example:

```bash
C:\Program Files\potrace\potrace.exe
```

Update path in:

```python
subprocess.run([
    r"C:\Program Files\potrace\potrace.exe",
```

inside:

```bash
backend/main.py
```

---

# Install FontForge

Download:

* https://fontforge.org/en-US/downloads/windows/

After installation:

* locate `ffpython.exe`

Example:

```bash
C:\Program Files (x86)\FontForgeBuilds\bin\ffpython.exe
```

Update path in:

```python
subprocess.run([
    r"C:\Program Files (x86)\FontForgeBuilds\bin\ffpython.exe",
```

inside:

```bash
backend/main.py
```

---

# Folder Setup

Create folders:

```bash
generated/
generated/png/
generated/svg/
generated/fonts/
```

Or run:

```bash
mkdir generated
mkdir generated/png
mkdir generated/svg
mkdir generated/fonts
```

---

# Add Model Checkpoint

Place model checkpoint:

```bash
latest.pt
```

inside:

```bash
backend/.pt/
```

Final structure:

```bash
backend/
└── .pt/
    └── latest.pt
```

---

# Add Font File

Place base font:

```bash
arial.ttf
```

inside:

```bash
backend/fonts/
```

Final structure:

```bash
backend/
└── fonts/
    └── arial.ttf
```

---

# Run Backend

```bash
cd backend

uvicorn main:app --reload
```

Backend runs on:

```bash
http://127.0.0.1:8000
```

---

# Features

## Generate Preview

* Upload handwriting PNG samples
* Generate AI glyph previews
* Generate `.ttf` font automatically

## Export Font

* Download generated `.ttf`

## Live Font Preview

* Preview generated font directly in browser

---

# Pipeline

```text
PNG samples
    ↓
PyTorch Generator
    ↓
Generated PNG glyphs
    ↓
Potrace
    ↓
SVG glyphs
    ↓
FontForge
    ↓
TTF font
```

---

# Notes

## Potrace + FontForge

These are external executables.

The backend uses:

```python
subprocess.run(...)
```

to call them.

Both programs must be installed on the machine running the backend.

---

# Current Character Set

```text
1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ
```

Only generated glyphs are available in the final font.

If a character is missing:

* the browser will fallback to another font automatically.

---

# Deployment Notes

Deployment server must include:

* Python
* PyTorch
* Potrace
* FontForge

because Potrace and FontForge are not standard Python libraries.

---

# Tech Stack

Frontend:

* Next.js
* TypeScript
* TailwindCSS
* Ant Design

Backend:

* FastAPI
* PyTorch
* Pillow

Font Generation:

* Potrace
* FontForge
