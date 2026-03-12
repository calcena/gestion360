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
│   │   └── envio.php  # Create/Edit task page
│   ├── comentarios.php
│   └── components/
│       ├── sidebar.php  # Lateral menu with user info
│       └── footer.php
├── services/           # JavaScript frontend services
│   ├── main/
│   │   ├── main.js     # Main dashboard logic
│   │   └── pwa.js      # Service worker unregister (disabled)
│   ├── login/
│   │   ├── login.js    # Authentication
│   │   └── pwa.js      # Service worker unregister (disabled)
│   ├── envios/
│   ├── logs/
│   ├── translate/
│   ├── helpers/
│   └── components/
│       └── sitebar.js  # Lateral menu logic
├── helpers/            # PHP helpers & config
│   ├── config.php      # Loads .env configuration
│   └── helper.php
├── jobs/               # Background jobs (cron)
│   └── cron_email.php
├── assets/             # Static assets
│   ├── css/
│   ├── js/
│   │   └── axios/      # Axios library
│   └── images/icons/   # UI icons
├── database/           # Database schemas
├── tests/              # Test files
├── repositories/       # Data repositories
├── photos/            # User/uploaded photos
├── attachments/        # File attachments
├── manifest.json      # PWA manifest (disabled)
└── index.php          # Entry point (login page)
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
- Shipment management (envios/tasks)
- Subtasks (subtareas)
- Multi-language support (translate)
- File attachments (PDF)
- Logging system
- Background email jobs
- Lateral menu with user info

## Entry Points
- `index.php` - Login page
- `views/main.php` - Main dashboard (after auth)
- `views/envios/envio.php?modo=nuevo` - Create new task
- `views/envios/envio.php?modo=edit&envio_id=X` - Edit task
- `controllers/*.php` - API endpoints

## Navigation Depth System
The application uses `$navigation_deep` variable to handle relative paths across different directory levels:

| Page | navigation_deep | Base Path |
|------|-----------------|-----------|
| views/main.php | 0 | ../ |
| views/envios/envio.php | 2 | ../../ |

Used in:
- `views/components/sidebar.php` - For icon paths and menu actions
- `services/components/sitebar.js` - For navigation links

## UI Changes (Recent)

### Sidebar (views/components/sidebar.php)
- Shows logged user name at bottom (green color #228B22)
- Uses flexbox with `mt-auto` class for positioning
- Includes: search input, create task (role 1-2), exit option

### Task Creation/Edit (views/envios/envio.php)
- Upload icon changed from `pdf_envio.png` to `upload.png`
- Priority and attachment in same row (responsive)
- Priority selector available when creating (not only after saving)
- Back button removed from header
- Badge removed from header

### CSS (assets/css/style.css)
- `.lateral-menu` - Fixed sidebar menu styling
- `.lateral-menu .menu-items` - Flex container for menu items
- `.menu-icon-right` - Menu item icons

## PWA/Service Worker (DISABLED)
- `service-worker.js` removed from root
- `services/main/pwa.js` - Contains unregister code
- `services/login/pwa.js` - Contains unregister code
- `manifest.json` - Still present but not actively used

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
