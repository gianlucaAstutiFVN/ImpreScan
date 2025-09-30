const database = require('../config/database');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

class ATECOStructureImporter {
  constructor() {
    this.excelFile = path.join(__dirname, '../../client/public/StrutturaATECO-2025-IT-EN-1.xlsx');
    this.stats = {
      totalRows: 0,
      importedRows: 0,
      skippedRows: 0,
      errors: 0
    };
  }

  async importStructure() {
    console.log('🚀 Starting ATECO structure import...');
    console.log(`📄 Excel file: ${this.excelFile}`);
    
    try {
      if (!fs.existsSync(this.excelFile)) {
        throw new Error(`Excel file not found: ${this.excelFile}`);
      }

      await database.connect();
      
      // Clear existing ATECO data
      await this.clearExistingData();
      
      // Read and process Excel file
      await this.processExcelFile();
      
      // Show final statistics
      await this.showFinalStats();
      
      console.log('✅ ATECO structure import completed successfully!');
      
    } catch (error) {
      console.error('❌ Error importing ATECO structure:', error);
      throw error;
    } finally {
      await database.close();
    }
  }

  async clearExistingData() {
    console.log('🧹 Clearing existing ATECO data...');
    await database.run('DELETE FROM ateco_codes');
    console.log('✅ Existing ATECO data cleared');
  }

  async processExcelFile() {
    console.log('📊 Reading Excel file...');
    
    const workbook = XLSX.readFile(this.excelFile);
    const sheetName = 'ATECO 2025 Struttura'; // Use the correct sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`📄 Found ${data.length} rows in Excel file`);
    
    // Process each row (skip header row)
    for (let i = 1; i < data.length; i++) {
      try {
        this.stats.totalRows++;
        
        const row = data[i];
        const atecoData = this.parseRow(row);
        
        if (!this.isValidATECOData(atecoData)) {
          this.stats.skippedRows++;
          continue;
        }
        
        await this.insertATECORecord(atecoData);
        this.stats.importedRows++;
        
        if (i % 500 === 0) {
          console.log(`📊 Processed ${i} rows...`);
        }
        
      } catch (error) {
        this.stats.errors++;
        console.error(`Error processing row ${i}:`, error.message);
      }
    }
  }

  parseRow(row) {
    // Excel structure: [Order, Code, ItalianTitle, EnglishTitle, Hierarchy, ParentCode, ParentHierarchy]
    const code = row[1]?.toString().trim() || '';
    const name = row[2]?.toString().trim() || '';
    const level = parseInt(row[4]) || 0;
    const parentCode = row[5]?.toString().trim() || null;
    const description = row[3]?.toString().trim() || name;
    
    return {
      code,
      name,
      level,
      parent_code: parentCode,
      description
    };
  }

  determineLevel(code) {
    if (!code) return 0;
    
    // Count dots to determine level
    const dotCount = (code.match(/\./g) || []).length;
    
    if (dotCount === 0) return 1; // Section (A, B, C, etc.)
    if (dotCount === 1) return 2; // Division (A.01, A.02, etc.)
    if (dotCount === 2) return 3; // Group (A.01.1, A.01.2, etc.)
    if (dotCount === 3) return 4; // Class (A.01.11, A.01.12, etc.)
    if (dotCount === 4) return 5; // Subclass (A.01.11.1, A.01.11.2, etc.)
    if (dotCount === 5) return 6; // Category (A.01.11.10, A.01.11.20, etc.)
    
    return 0;
  }

  getParentCode(code) {
    if (!code) return null;
    
    const dotCount = (code.match(/\./g) || []).length;
    
    if (dotCount === 0) return null; // Top level
    
    // Remove last part to get parent
    const parts = code.split('.');
    parts.pop();
    return parts.join('.');
  }

  isValidATECOData(data) {
    return data.code && 
           data.name && 
           data.level > 0;
  }

  async insertATECORecord(data) {
    await database.run(`
      INSERT INTO ateco_codes (code, name, level, parent_code, description)
      VALUES (?, ?, ?, ?, ?)
    `, [data.code, data.name, data.level, data.parent_code, data.description]);
  }

  async showFinalStats() {
    console.log('\n📈 ATECO IMPORT STATISTICS:');
    console.log('============================');
    console.log(`Total rows processed: ${this.stats.totalRows.toLocaleString()}`);
    console.log(`Successfully imported: ${this.stats.importedRows.toLocaleString()}`);
    console.log(`Skipped rows: ${this.stats.skippedRows.toLocaleString()}`);
    console.log(`Errors: ${this.stats.errors.toLocaleString()}`);
    
    // Show database statistics
    const dbStats = await this.getDatabaseStats();
    console.log('\n📊 ATECO DATABASE STATISTICS:');
    console.log('==============================');
    console.log(`Total ATECO codes: ${dbStats.total.toLocaleString()}`);
    
    // By level
    console.log('\n📊 ATECO CODES BY LEVEL:');
    dbStats.byLevel.forEach(level => {
      console.log(`Level ${level.level}: ${level.count.toLocaleString()} codes`);
    });
    
    // Top sections
    console.log('\n🏆 TOP SECTIONS:');
    dbStats.topSections.forEach((section, i) => {
      console.log(`${i+1}. ${section.code} - ${section.name}: ${section.count} codes`);
    });
  }

  async getDatabaseStats() {
    const total = await database.get('SELECT COUNT(*) as total FROM ateco_codes');
    
    const byLevel = await database.all(`
      SELECT level, COUNT(*) as count
      FROM ateco_codes 
      GROUP BY level 
      ORDER BY level
    `);
    
    const topSections = await database.all(`
      SELECT code, name, COUNT(*) as count
      FROM ateco_codes 
      WHERE level = 1
      ORDER BY code
    `);
    
    return {
      total: total.total,
      byLevel,
      topSections
    };
  }
}

// Export for use in other scripts
module.exports = { ATECOStructureImporter };

// Run if called directly
if (require.main === module) {
  const importer = new ATECOStructureImporter();
  importer.importStructure().catch(console.error);
}
