const database = require('./config/database');

async function analyzeData() {
  try {
    // Connect to database
    await database.connect();
    console.log('Database connected');
    console.log('=== ANALISI STRUTTURA DATI ===\n');
    
    // Analizza la struttura dei dati per il settore A
    const structure = await database.all(`
      SELECT 
        settore,
        divisione,
        classe,
        sottocategoria,
        SUM(imprese_attive) as total_imprese
      FROM imprese 
      WHERE settore = 'A'
      GROUP BY settore, divisione, classe, sottocategoria
      ORDER BY settore, divisione, classe, sottocategoria
      LIMIT 20
    `);
    
    console.log('Esempi di struttura dati:');
    structure.forEach(row => {
      console.log(`${row.settore} | ${row.divisione} | ${row.classe} | ${row.sottocategoria} | ${row.total_imprese} imprese`);
    });
    
    console.log('\n=== ANALISI GERARCHIA ===\n');
    
    // Conta i livelli
    const levels = await database.all(`
      SELECT 
        CASE 
          WHEN sottocategoria IS NOT NULL AND sottocategoria != '' THEN 'sottocategoria'
          WHEN classe IS NOT NULL AND classe != '' THEN 'classe'
          WHEN divisione IS NOT NULL AND divisione != '' THEN 'divisione'
          ELSE 'settore'
        END as level_type,
        COUNT(*) as count,
        SUM(imprese_attive) as total_imprese
      FROM imprese 
      WHERE settore = 'A'
      GROUP BY level_type
      ORDER BY 
        CASE level_type
          WHEN 'settore' THEN 1
          WHEN 'divisione' THEN 2
          WHEN 'classe' THEN 3
          WHEN 'sottocategoria' THEN 4
        END
    `);
    
    console.log('Conteggi per livello:');
    levels.forEach(row => {
      console.log(`${row.level_type}: ${row.count} record, ${row.total_imprese} imprese`);
    });
    
    console.log('\n=== ESEMPI SPECIFICI ===\n');
    
    // Esempi specifici per capire la gerarchia
    const examples = await database.all(`
      SELECT 
        settore,
        divisione,
        classe,
        sottocategoria,
        SUM(imprese_attive) as total_imprese
      FROM imprese 
      WHERE settore = 'A' AND divisione = '01'
      GROUP BY settore, divisione, classe, sottocategoria
      ORDER BY classe, sottocategoria
      LIMIT 10
    `);
    
    console.log('Esempi per divisione 01:');
    examples.forEach(row => {
      console.log(`${row.settore} | ${row.divisione} | ${row.classe || 'NULL'} | ${row.sottocategoria || 'NULL'} | ${row.total_imprese} imprese`);
    });
    
  } catch (error) {
    console.error('Errore:', error);
  } finally {
    process.exit(0);
  }
}

analyzeData();
