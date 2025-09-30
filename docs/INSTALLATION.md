# Guida all'Installazione - Mappa Economia Italiana

## Prerequisiti

- **Node.js** (versione 16 o superiore)
- **npm** (incluso con Node.js)
- **Git** (per clonare il repository)

## Installazione Rapida

### Windows
```bash
# Esegui il file batch di avvio
start.bat
```

### Linux/macOS
```bash
# Rendi eseguibile lo script
chmod +x start.sh

# Esegui lo script di avvio
./start.sh
```

## Installazione Manuale

### 1. Clona il Repository
```bash
git clone <repository-url>
cd italian-economy-map
```

### 2. Installa le Dipendenze
```bash
# Installa tutte le dipendenze (root, client, server)
npm run install-all
```

### 3. Inizializza il Database
```bash
cd server
npm run init-db
cd ..
```

### 4. Avvia l'Applicazione
```bash
# Avvia sia frontend che backend
npm run dev
```

## Accesso all'Applicazione

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## Struttura del Progetto

```
italian-economy-map/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componenti React
│   │   ├── services/       # API services
│   │   └── App.js         # App principale
│   └── package.json
├── server/                 # Backend Node.js
│   ├── routes/            # API routes
│   ├── config/            # Configurazione database
│   ├── scripts/           # Script di inizializzazione
│   └── package.json
├── data/                  # Database SQLite
├── docs/                  # Documentazione
└── package.json          # Root package.json
```

## Configurazione

### Variabili d'Ambiente

Crea un file `.env` nella cartella `server/`:

```env
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:3000
DB_PATH=./data/database.sqlite
NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org
NOMINATIM_EMAIL=your-email@example.com
```

## Risoluzione Problemi

### Porta già in uso
```bash
# Cambia la porta nel file .env
PORT=3002
```

### Errori di dipendenze
```bash
# Pulisci e reinstalla
rm -rf node_modules package-lock.json
rm -rf client/node_modules client/package-lock.json
rm -rf server/node_modules server/package-lock.json
npm run install-all
```

### Database corrotto
```bash
# Ricrea il database
rm server/data/database.sqlite
cd server
npm run init-db
```

## Sviluppo

### Modalità Sviluppo
```bash
# Frontend solo
cd client && npm start

# Backend solo
cd server && npm run dev
```

### Build di Produzione
```bash
# Build frontend
cd client && npm run build

# Avvia in produzione
cd server && npm start
```
