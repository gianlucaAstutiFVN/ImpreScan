# 📁 CSV Data Directory

Questa cartella contiene i file CSV con i dati reali per l'applicazione Italian Economy Map.

## 📄 Formato dei File CSV

### 1. **ateco_codes.csv** - Classificazione ATECO
```csv
code,name,level,parent_code,description
A,Agricoltura silvicoltura e pesca,1,,Agricoltura silvicoltura e pesca
A.01,Coltivazioni agricole e produzione di prodotti animali,2,A,Coltivazioni agricole e produzione di prodotti animali
A.01.1,Coltivazione di colture permanenti,3,A.01,Coltivazione di colture permanenti
```

**Colonne richieste:**
- `code` - Codice ATECO (es. A, A.01, A.01.1)
- `name` - Nome della classificazione
- `level` - Livello gerarchico (1-6)
- `parent_code` - Codice del livello superiore (opzionale)
- `description` - Descrizione dettagliata (opzionale)

### 2. **companies.csv** - Dati Aziende
```csv
name,ateco_code,address,city,province,region,postal_code,phone,email,website,employees,revenue,latitude,longitude
Barilla G. e R. Fratelli S.p.A.,C.10.73,Via Mantova 166,Parma,PR,Emilia-Romagna,43122,+39 0521 262626,info@barilla.com,www.barilla.com,8500,3500000000,44.8015,10.3279
```

**Colonne richieste:**
- `name` - Nome dell'azienda
- `ateco_code` - Codice ATECO
- `address` - Indirizzo (opzionale)
- `city` - Città (opzionale)
- `province` - Provincia (opzionale)
- `region` - Regione (opzionale)
- `postal_code` - CAP (opzionale)
- `phone` - Telefono (opzionale)
- `email` - Email (opzionale)
- `website` - Sito web (opzionale)
- `employees` - Numero dipendenti (opzionale)
- `revenue` - Fatturato (opzionale)
- `latitude` - Latitudine (opzionale)
- `longitude` - Longitudine (opzionale)

### 3. **regions.csv** - Dati Regioni
```csv
code,name,population,area
01,Piemonte,4356406,25387.07
02,Valle d'Aosta,125666,3260.90
```

**Colonne richieste:**
- `code` - Codice regione (es. 01, 02)
- `name` - Nome della regione
- `population` - Popolazione (opzionale)
- `area` - Superficie in km² (opzionale)

## 🚀 Come Importare i Dati

### 1. **Preparare i File CSV**
- Salva i tuoi file CSV in questa cartella
- Assicurati che abbiano le colonne richieste
- I nomi dei file possono essere personalizzati

### 2. **Importare i Dati**
```bash
# Dal terminale, nella directory del progetto
cd server
node scripts/import-csv-data.js import
```

### 3. **Comandi Disponibili**
```bash
# Importa tutti i file CSV
node scripts/import-csv-data.js import

# Esporta i dati attuali in CSV
node scripts/import-csv-data.js export

# Lista i file CSV disponibili
node scripts/import-csv-data.js list

# Crea file CSV di esempio
node scripts/import-csv-data.js sample
```

## 📊 Fonti Dati Consigliate

### **Camere di Commercio - Open Data**
- **Marche**: https://www.marche.camcom.it/open-data/imprese
- **Lombardia**: https://www.lombardia.camcom.it/open-data/imprese
- **Emilia-Romagna**: https://www.emiliaromagna.camcom.it/open-data/imprese
- **Toscana**: https://www.toscana.camcom.it/open-data/imprese
- **Veneto**: https://www.veneto.camcom.it/open-data/imprese

### **ISTAT - Classificazione ATECO**
- **ATECO 2025**: https://www.istat.it/storage/codici-classificazioni/ATECO_2025.csv
- **Regioni**: https://www.istat.it/storage/codici-classificazioni/regioni.csv

### **Registro Imprese**
- **API pubbliche**: https://api.registroimprese.it/v1

## 🔧 Personalizzazione

### **Formati CSV Supportati**
Lo script supporta diversi nomi di colonne:
- `name` o `nome` o `ragione_sociale`
- `ateco_code` o `codice_ateco`
- `address` o `indirizzo`
- `city` o `citta` o `comune`
- `province` o `provincia`
- `region` o `regione`
- E molti altri...

### **Geocoding Automatico**
Se non hai le coordinate lat/lng, lo script può geocodificare automaticamente gli indirizzi usando OpenStreetMap.

## ⚠️ Note Importanti

1. **Backup**: Fai sempre un backup del database prima di importare nuovi dati
2. **Formato**: I file CSV devono essere in formato UTF-8
3. **Separatori**: Usa la virgola (,) come separatore
4. **Encoding**: Assicurati che i caratteri speciali siano correttamente codificati
5. **Dimensioni**: Per file molto grandi (>100MB), considera di dividerli in parti più piccole

## 🆘 Supporto

Se hai problemi con l'importazione:
1. Controlla il formato dei file CSV
2. Verifica che le colonne richieste siano presenti
3. Controlla i log per errori specifici
4. Usa i file di esempio come riferimento
