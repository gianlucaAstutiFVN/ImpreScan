const database = require('../config/database');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

class ISTATDataImporter {
  constructor() {
    this.csvFile = path.join(__dirname, '../data/csv/2025-06-30-Stock-Imprese-Attive-Italia.csv');
    this.batchSize = 100; // Reduced batch size to avoid SQLite parameter limit (100 * 7 = 700 params)
    this.stats = {
      totalRows: 0,
      importedRows: 0,
      skippedRows: 0,
      errors: 0
    };
  }

  async importData() {
    console.log('🚀 Starting ISTAT data import...');
    console.log(`📄 CSV file: ${this.csvFile}`);
    
    try {
      if (!fs.existsSync(this.csvFile)) {
        throw new Error(`CSV file not found: ${this.csvFile}`);
      }

      await database.connect();
      
      // Clear existing data
      await this.clearExistingData();
      
      // Import data in chunks
      await this.importInChunks();
      
      // Show final statistics
      await this.showFinalStats();
      
      console.log('✅ ISTAT data import completed successfully!');
      
    } catch (error) {
      console.error('❌ Error importing ISTAT data:', error);
      throw error;
    } finally {
      await database.close();
    }
  }

  async clearExistingData() {
    console.log('🧹 Clearing existing data...');
    await database.run('DELETE FROM imprese');
    console.log('✅ Existing data cleared');
  }

  async importInChunks() {
    console.log('📊 Starting chunked import...');
    
    return new Promise((resolve, reject) => {
      let batch = [];
      let currentChunk = 0;
      
      fs.createReadStream(this.csvFile)
        .pipe(csv({
          separator: ';',
          headers: ['regione', 'provincia', 'settore', 'divisione', 'classe', 'sottocategoria', 'imprese_attive']
        }))
        .on('data', (row) => {
          try {
            this.stats.totalRows++;
            
            // Clean and validate data
            const cleanRow = this.cleanRow(row);
            
            if (!this.isValidRow(cleanRow)) {
              this.stats.skippedRows++;
              return;
            }
            
            batch.push(cleanRow);
            
          } catch (error) {
            this.stats.errors++;
            console.error(`Error processing row ${this.stats.totalRows}:`, error.message);
          }
        })
        .on('end', async () => {
          try {
            // Process all batches sequentially
            for (let i = 0; i < batch.length; i += this.batchSize) {
              const currentBatch = batch.slice(i, i + this.batchSize);
              await this.processBatch(currentBatch, currentChunk);
              currentChunk++;
              
              if (currentChunk % 100 === 0) {
                console.log(`📊 Processed ${currentChunk} batches: ${this.stats.importedRows.toLocaleString()} rows imported`);
              }
            }
            
            console.log('📊 Chunked import completed');
            resolve();
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  cleanRow(row) {
    return {
      regione: row.regione?.trim() || '',
      provincia: row.provincia?.trim() || '',
      settore: row.settore?.trim() || '',
      divisione: row.divisione?.trim() || '',
      classe: row.classe?.trim() || '',
      sottocategoria: row.sottocategoria?.trim() || '',
      imprese_attive: parseInt(row.imprese_attive) || 0
    };
  }

  isValidRow(row) {
    return row.regione && 
           row.provincia && 
           row.settore && 
           row.divisione && 
           row.classe && 
           row.sottocategoria && 
           row.imprese_attive > 0;
  }

  async processBatch(batch, chunkNumber) {
    try {
      const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
      const values = batch.flatMap(row => [
        row.regione,
        row.provincia,
        row.settore,
        row.divisione,
        row.classe,
        row.sottocategoria,
        row.imprese_attive
      ]);
      
      await database.run(`
        INSERT INTO imprese 
        (regione, provincia, settore, divisione, classe, sottocategoria, imprese_attive)
        VALUES ${placeholders}
      `, values);
      
      this.stats.importedRows += batch.length;
      
      if (chunkNumber % 10 === 0) {
        console.log(`📊 Processed chunk ${chunkNumber}: ${this.stats.importedRows.toLocaleString()} rows imported`);
      }
      
    } catch (error) {
      console.error(`Error processing batch ${chunkNumber}:`, error);
      throw error;
    }
  }

  async showFinalStats() {
    console.log('\n📈 IMPORT STATISTICS:');
    console.log('========================');
    console.log(`Total rows processed: ${this.stats.totalRows.toLocaleString()}`);
    console.log(`Successfully imported: ${this.stats.importedRows.toLocaleString()}`);
    console.log(`Skipped rows: ${this.stats.skippedRows.toLocaleString()}`);
    console.log(`Errors: ${this.stats.errors.toLocaleString()}`);
    
    // Show database statistics
    const dbStats = await this.getDatabaseStats();
    console.log('\n📊 DATABASE STATISTICS:');
    console.log('========================');
    console.log(`Total records in database: ${dbStats.total.toLocaleString()}`);
    console.log(`Unique regions: ${dbStats.regions}`);
    console.log(`Unique provinces: ${dbStats.provinces}`);
    console.log(`Unique sectors: ${dbStats.sectors}`);
    
    // Top regions
    console.log('\n🏆 TOP 10 REGIONS:');
    dbStats.topRegions.forEach((region, i) => {
      console.log(`${i+1}. ${region.regione}: ${region.total_imprese.toLocaleString()} imprese`);
    });
    
    // Top sectors
    console.log('\n🏆 TOP 10 SECTORS:');
    dbStats.topSectors.forEach((sector, i) => {
      console.log(`${i+1}. Settore ${sector.settore}: ${sector.total_imprese.toLocaleString()} imprese`);
    });
  }

  async getDatabaseStats() {
    const total = await database.get('SELECT COUNT(*) as total FROM imprese');
    
    const regions = await database.get('SELECT COUNT(DISTINCT regione) as regions FROM imprese');
    const provinces = await database.get('SELECT COUNT(DISTINCT provincia) as provinces FROM imprese');
    const sectors = await database.get('SELECT COUNT(DISTINCT settore) as sectors FROM imprese');
    
    const topRegions = await database.all(`
      SELECT regione, SUM(imprese_attive) as total_imprese
      FROM imprese 
      GROUP BY regione 
      ORDER BY total_imprese DESC 
      LIMIT 10
    `);
    
    const topSectors = await database.all(`
      SELECT settore, SUM(imprese_attive) as total_imprese
      FROM imprese 
      GROUP BY settore 
      ORDER BY total_imprese DESC 
      LIMIT 10
    `);
    
    return {
      total: total.total,
      regions: regions.regions,
      provinces: provinces.provinces,
      sectors: sectors.sectors,
      topRegions,
      topSectors
    };
  }
}

// Export for use in other scripts
module.exports = { ISTATDataImporter };

// Run if called directly
if (require.main === module) {
  const importer = new ISTATDataImporter();
  importer.importData().catch(console.error);
}
