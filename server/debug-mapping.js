const database = require('./config/database');

async function debugMapping() {
  try {
    await database.connect();
    console.log('Database connected');
    
    console.log('=== DEBUG MAPPING ATECO vs ISTAT ===\n');
    
    // Get ATECO codes from the tree
    const atecoCodes = await database.all(`
      SELECT code, name, level, parent_code
      FROM ateco_codes
      WHERE code LIKE 'A%' OR code LIKE '01%'
      ORDER BY code
      LIMIT 20
    `);
    
    console.log('ATECO codes:');
    atecoCodes.forEach(code => {
      console.log(`${code.code} | ${code.name} | Level ${code.level}`);
    });
    
    console.log('\n=== ISTAT DATA ===');
    
    // Get ISTAT data for sector A
    const istatData = await database.all(`
      SELECT 
        settore,
        divisione,
        classe,
        sottocategoria,
        SUM(imprese_attive) as total_companies
      FROM imprese 
      WHERE settore = 'A'
      GROUP BY settore, divisione, classe, sottocategoria
      ORDER BY settore, divisione, classe, sottocategoria
      LIMIT 20
    `);
    
    console.log('ISTAT data:');
    istatData.forEach(item => {
      console.log(`${item.settore} | ${item.divisione} | ${item.classe} | ${item.sottocategoria} | ${item.total_companies} imprese`);
    });
    
    console.log('\n=== MAPPING ANALYSIS ===');
    
    // Try to find matches
    for (const atecoCode of atecoCodes) {
      const matches = istatData.filter(item => {
        return (
          item.settore === atecoCode.code ||
          item.divisione === atecoCode.code ||
          item.classe === atecoCode.code ||
          item.sottocategoria === atecoCode.code
        );
      });
      
      if (matches.length > 0) {
        console.log(`ATECO ${atecoCode.code} matches:`);
        matches.forEach(match => {
          console.log(`  ${match.settore} | ${match.divisione} | ${match.classe} | ${match.sottocategoria} | ${match.total_companies} imprese`);
        });
      }
    }
    
  } catch (error) {
    console.error('Errore:', error);
  } finally {
    process.exit(0);
  }
}

debugMapping();
