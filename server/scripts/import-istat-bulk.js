const database = require('../config/database');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

async function importISTATDataBulk() {
  console.log('🚀 Starting ISTAT data import (bulk approach)...');
  
  const csvFile = path.join(__dirname, '../data/csv/2025-06-30-Stock-Imprese-Attive-Italia.csv');
  
  try {
    if (!fs.existsSync(csvFile)) {
      throw new Error(`CSV file not found: ${csvFile}`);
    }

    await database.connect();
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await database.run('DELETE FROM imprese');
    console.log('✅ Existing data cleared');
    
    // Read all data into memory first
    console.log('📖 Reading CSV data into memory...');
    const allData = [];
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFile)
        .pipe(csv({
          separator: ';',
          headers: ['regione', 'provincia', 'settore', 'divisione', 'classe', 'sottocategoria', 'imprese_attive']
        }))
        .on('data', (row) => {
          // Clean and validate data
          const cleanRow = {
            regione: row.regione?.trim() || '',
            provincia: row.provincia?.trim() || '',
            settore: row.settore?.trim() || '',
            divisione: row.divisione?.trim() || '',
            classe: row.classe?.trim() || '',
            sottocategoria: row.sottocategoria?.trim() || '',
            imprese_attive: parseInt(row.imprese_attive) || 0
          };
          
          // Skip invalid rows
          if (cleanRow.regione && cleanRow.provincia && cleanRow.settore && cleanRow.imprese_attive > 0) {
            allData.push(cleanRow);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`📊 Loaded ${allData.length.toLocaleString()} valid rows into memory`);
    
    // Insert all data in one transaction
    console.log('💾 Inserting data into database...');
    await database.run('BEGIN TRANSACTION');
    
    try {
      // Prepare statement for better performance
      const stmt = database.db.prepare(`
        INSERT INTO imprese 
        (regione, provincia, settore, divisione, classe, sottocategoria, imprese_attive)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (let i = 0; i < allData.length; i++) {
        const row = allData[i];
        stmt.run([
          row.regione,
          row.provincia,
          row.settore,
          row.divisione,
          row.classe,
          row.sottocategoria,
          row.imprese_attive
        ]);
        
        if (i % 10000 === 0) {
          console.log(`📊 Processed ${i.toLocaleString()} / ${allData.length.toLocaleString()} rows...`);
        }
      }
      
      stmt.finalize();
      await database.run('COMMIT');
      
      console.log(`✅ Import completed: ${allData.length.toLocaleString()} rows imported`);
      
    } catch (error) {
      await database.run('ROLLBACK');
      throw error;
    }
    
    // Show statistics
    await showStatistics();
    
    await database.close();
    
  } catch (error) {
    console.error('❌ Error importing ISTAT data:', error);
    throw error;
  }
}

async function showStatistics() {
  console.log('\n📈 IMPORT STATISTICS:');
  console.log('========================');
  
  const total = await database.get('SELECT COUNT(*) as total FROM imprese');
  console.log(`Total records: ${total.total.toLocaleString()}`);
  
  const regions = await database.all(`
    SELECT regione, COUNT(*) as records, SUM(imprese_attive) as total_imprese
    FROM imprese 
    GROUP BY regione 
    ORDER BY total_imprese DESC 
    LIMIT 10
  `);
  
  console.log('\nTop 10 regions:');
  regions.forEach((r, i) => {
    console.log(`${i+1}. ${r.regione}: ${r.total_imprese.toLocaleString()} imprese (${r.records} records)`);
  });
  
  const sectors = await database.all(`
    SELECT settore, COUNT(*) as records, SUM(imprese_attive) as total_imprese
    FROM imprese 
    GROUP BY settore 
    ORDER BY total_imprese DESC 
    LIMIT 10
  `);
  
  console.log('\nTop 10 sectors:');
  sectors.forEach((s, i) => {
    console.log(`${i+1}. Settore ${s.settore}: ${s.total_imprese.toLocaleString()} imprese (${s.records} records)`);
  });
}

// Run if called directly
if (require.main === module) {
  importISTATDataBulk().catch(console.error);
}

module.exports = { importISTATDataBulk };
