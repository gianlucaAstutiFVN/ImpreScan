# Italian Economy Interactive Map

Una mappa interattiva e dinamica per esplorare l'economia italiana dal livello macro (Sezioni ATECO) fino alle singole aziende, utilizzando risorse open data gratuite.

## Caratteristiche

- 🗺️ **Visualizzazione geografica interattiva** con zoom su Regione, Provincia, Comune
- 🌳 **Navigazione gerarchica ATECO** completa (Sezione → Divisione → Gruppo → Classe → Categoria → Sottocategoria)
- 🔍 **Filtri dinamici** che aggiornano mappa e lista aziende in tempo reale
- 📊 **Statistiche aggregate** per ogni livello ATECO selezionato
- 🏢 **Lista aziende filtrabile** con ricerca testuale e filtri per dimensione
- 📤 **Esportazione dati** in CSV/Excel
- 📱 **Design responsive** per desktop e mobile

## Fonti Dati

- **Dataset Camere di Commercio**: Elenco aziende per provincia con codice ATECO
- **ISTAT ATECO 2025**: Classificazione gerarchica completa
- **OpenStreetMap/Nominatim**: Geocoding gratuito per localizzazione aziende

## Tecnologie

- **Frontend**: React + Leaflet
- **Backend**: Node.js + Express
- **Database**: SQLite per sviluppo, PostgreSQL per produzione
- **Geocoding**: Nominatim (OpenStreetMap)

## Installazione

```bash
# Installa tutte le dipendenze
npm run install-all

# Avvia l'applicazione in modalità sviluppo
npm run dev
```

## Struttura Progetto

```
├── client/          # Frontend React
├── server/          # Backend Node.js
├── data/           # Dataset e script di importazione
└── docs/           # Documentazione
```

## API Endpoints

- `GET /api/ateco` - Classificazione ATECO gerarchica
- `GET /api/companies` - Lista aziende con filtri
- `GET /api/statistics` - Statistiche aggregate
- `GET /api/geocode` - Geocoding indirizzi

## Licenza

MIT
