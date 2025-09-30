const database = require('../config/database');

async function initializeDatabase() {
  console.log('🚀 Initializing database...');
  
  try {
    await database.connect();
    console.log('✅ Database initialized successfully!');
    
    // Show database status
    const tables = await database.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
    
    console.log('\n📊 Database tables:');
    tables.forEach(table => {
      console.log(`   - ${table.name}`);
    });
    
    console.log('\n🎯 Next steps:');
    console.log('   1. Import ATECO structure: npm run import-ateco');
    console.log('   2. Import ISTAT data: npm run import-istat');
    console.log('   3. Or import all: npm run import-all');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    await database.close();
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase().catch(console.error);
}

module.exports = { initializeDatabase };