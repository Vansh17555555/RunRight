# RunRight Worker Service

The heavy-lifting execution engine of RunRight. It pulls jobs from Redis and executes untrusted user code inside isolated Docker containers.

## 🚀 Features

- **Isolation**: Every code run happens in a fresh, ephemeral Docker container.
- **Sandboxing**: Strictly limited CPU, Memory, and Network access (Air-gapped).
- **Hardened Security**: Mounts the container as Read-Only with a secure `/tmp:exec` partition.
- **Judging**: Compares code output against multiple test cases for competitive programming.
- **Safety**: Built-in 15-second "Killer" to stop infinite loops or resource abuse.

## 🛠️ Tech Stack

- **Node.js**
- **Docker Engine** (Host must have Docker installed)
- **Redis** (Job Queue)
- **TypeScript**

## 🏃 Getting Started

### Prerequisites

- Node.js (v18+)
- **Docker Desktop** (or Engine) running on the host.
- Redis running on `localhost:6379`.

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## 🛡️ Sandbox Details

The worker currently supports:

- **Python 3.9-slim**
- **Node.js 18-slim**
- **GCC (C++20)**

### Security Flags Used

- `--network=none`: No internet access for user code.
- `--memory=128m-256m`: Prevents memory exhaustion attacks.
- `--pids-limit=64`: Prevents fork bombs.
- `--read-only`: Prevents modification of the OS filesystem.
