# GESTIÓN DE PEDIDOS - Project Documentation

## Overview
PHP/JavaScript web application for order/shipment management with multi-language support.

## Architecture
```
gestion_pedidos/
├── api/                 # Backend API endpoints (PHP)
│   ├── envios/         # Shipments API
│   ├── subtareas/      # Subtasks API
│   ├── helpers/        # API helpers
│   ├── login/          # Authentication API
│   └── log/            # Logging API
├── controllers/        # PHP Controllers (request handling)
│   ├── attach.php
│   ├── envio.php
│   ├── subtarea.php
│   ├── login.php
│   └── ...
├── models/             # PHP Models (data layer)
│   ├── envio.php
│   ├── subtarea.php
│   └── ...
├── views/              # PHP Views (presentation)
│   ├── main.php
│   ├── envios/
│   └── components/
├── services/           # JavaScript frontend services
│   ├── main/
│   ├── login/
│   ├── envios/
│   ├── logs/
│   ├── translate/
│   └── helpers/
├── helpers/            # PHP helpers & config
│   ├── config.php      # Loads .env configuration
│   └── helper.php
├── jobs/               # Background jobs (cron)
│   └── cron_email.php
├── assets/             # Static assets
│   ├── css/
│   ├── js/
│   └── images/
├── database/           # Database schemas
├── tests/              # Test files
├── repositories/       # Data repositories
├── photos/             # User/uploaded photos
├── attachments/        # File attachments
└── index.php           # Entry point (login page)
```

## Configuration
- **Config file**: `helpers/config.php` loads `.env` variables
- **Environment**: `.env` file (root or parent directories)
- **Required variables**:
  - `APP_ENV`, `APP_NAME`, `APP_VERSION`
  - `API_KEY_FRONT`, `API_KEY_BACK`
  - `DB_TYPE`, `DB_PATH`

## Tech Stack
- **Backend**: PHP
- **Frontend**: JavaScript (Vanilla + Axios)
- **CSS**: Bootstrap 5
- **Database**: SQLite (configurable via DB_TYPE/DB_PATH)

## Key Features
- User authentication (login)
- Shipment management (envios)
- Subtasks (subtareas)
- Multi-language support (translate)
- File attachments
- Logging system
- Background email jobs

## Entry Points
- `index.php` - Login page
- `views/main.php` - Main dashboard (after auth)
- `controllers/*.php` - API endpoints

## PDF Viewer Editor
Located in `services/main/main.js`:
- **Tools**: Pen (bolígrafo), Highlight (resaltador), Text (texto), Eraser (borrador)
- **Highlight**: Rectangle highlight with ~25% opacity (suffix '40'), draws areas while dragging
- **Pen**: Default color blue (#2196f3)
- **Storage**: Annotations stored per-page in memory as dataURLs

## PDF.js Viewer (assets/pdfjs/web/)
The standard PDF.js viewer includes built-in annotation tools:
- **Highlight tool**: Available in editor toolbar
- **Default colors**: Blue (#2196f3) added as first option
- **Enable**: Configured via `annotationEditorMode` option set to 4 (HIGHLIGHT)
