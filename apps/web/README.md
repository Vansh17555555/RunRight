# RunRight Web Dashboard

A premium, high-performance coding interface built with Next.js and Tailwind CSS.

## ✨ Features

- **Monaco Editor**: Industrial-standard code editor with syntax highlighting.
- **Real-time Judging**: Live result streaming via Socket.io.
- **Problem Descriptions**: Side-by-side view with Markdown support.
- **Responsive Design**: Dark-mode primary, mobile-friendly layout.
- **Authentication**: Secure Login/Register flows.

## 🛠️ Tech Stack

- **Next.js 15+** (App Router)
- **Tailwind CSS**
- **Lucide React** (Icons)
- **Socket.io-client**
- **Axios** (API requests)

## 🏃 Getting Started

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## ⚙️ Configuration

The frontend expects the API to be running on `http://localhost:3000`. This is currently hardcoded in the `API_BASE` constants within the pages.
