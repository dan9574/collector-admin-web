## Project Overview

This repository contains the **frontend part** of the Collector Admin demo system.  
It is built with **React + Vite + Tailwind CSS + Ant Design**, and is designed to work in a **front-end / back-end separated architecture**.  
The corresponding backend implementation can be found here:  
👉 [collector-admin-backend](https://github.com/dan9574/collector-admin-backend)

## Core Features

- **UI Modules**: Templates, Tasks, Export Management, System Management.  
- **API Integration**: Connects to the backend REST API (Spring Boot) running on port **8081**.  
- **Authentication**: Cookie-based session management, login/logout flow.  
- **Styling**: Tailwind CSS with custom theme, Ant Design components.  

## Usage

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the frontend (default port: 5173, proxy to backend 8081):
```bash
npm run dev
```
3. Access the system UI in your browser:

```arduino
http://localhost:5173
```

Related Repositories
collector-admin-backend — Spring Boot + JPA/PostgreSQL backend with cookie-session authentication.

This frontend repo and the linked backend repo together form a complete full-stack demo showcasing authentication, task management, templates, and export modules in a separated architecture.
