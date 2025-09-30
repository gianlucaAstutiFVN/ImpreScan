const database = require('../config/database');

async function exploreData() {
  console.log('🔍 Exploring database data...');
  
  try {
    await database.connect();
    
    // 1. Conta totale record
    const total = await database.get('SELECT COUNT(*) as total FROM imprese');
    console.log(`\n📊 TOTALE RECORD: ${total.total.toLocaleString()}`);
    
    // 2. Prime 10 righe
    console.log('\n📋 PRIME 10 RIGHE:');
    const sample = await database.all(`
      SELECT regione, provincia, settore, divisione, classe, sottocategoria, imprese_attive
      FROM imprese 
      ORDER BY imprese_attive DESC
      LIMIT 10
    `);
    
    sample.forEach((row, i) => {
      console.log(`${i+1}. ${row.regione} - ${row.provincia} | Settore ${row.settore} | ${row.imprese_attive.toLocaleString()} imprese`);
    });
    
    // 3. Distribuzione per regione
    console.log('\n🗺️ DISTRIBUZIONE PER REGIONE:');
    const regions = await database.all(`
      SELECT regione, COUNT(*) as records, SUM(imprese_attive) as total_imprese
      FROM imprese 
      GROUP BY regione 
      ORDER BY total_imprese DESC
    `);
    
    regions.forEach((r, i) => {
      console.log(`${i+1}. ${r.regione}: ${r.total_imprese.toLocaleString()} imprese (${r.records} records)`);
    });
    
    // 4. Distribuzione per settore
    console.log('\n🏭 DISTRIBUZIONE PER SETTORE:');
    const sectors = await database.all(`
      SELECT settore, COUNT(*) as records, SUM(imprese_attive) as total_imprese
      FROM imprese 
      GROUP BY settore 
      ORDER BY total_imprese DESC
    `);
    
    sectors.forEach((s, i) => {
      console.log(`${i+1}. Settore ${s.settore}: ${s.total_imprese.toLocaleString()} imprese (${s.records} records)`);
    });
    
    // 5. Top province
    console.log('\n🏙️ TOP 15 PROVINCE:');
    const provinces = await database.all(`
      SELECT provincia, regione, SUM(imprese_attive) as total_imprese
      FROM imprese 
      GROUP BY provincia, regione 
      ORDER BY total_imprese DESC
      LIMIT 15
    `);
    
    provinces.forEach((p, i) => {
      console.log(`${i+1}. ${p.provincia} (${p.regione}): ${p.total_imprese.toLocaleString()} imprese`);
    });
    
    // 6. Esempi di codici ATECO
    console.log('\n📋 ESEMPI DI CODICI ATECO:');
    const atecoExamples = await database.all(`
      SELECT DISTINCT settore, divisione, classe, sottocategoria, SUM(imprese_attive) as total_imprese
      FROM imprese 
      WHERE settore = 'A'
      GROUP BY settore, divisione, classe, sottocategoria
      ORDER BY total_imprese DESC
      LIMIT 10
    `);
    
    atecoExamples.forEach((a, i) => {
      console.log(`${i+1}. ${a.settore}.${a.divisione}.${a.classe}.${a.sottocategoria}: ${a.total_imprese.toLocaleString()} imprese`);
    });
    
    // 7. Statistiche generali
    console.log('\n📈 STATISTICHE GENERALI:');
    const stats = await database.get(`
      SELECT 
        COUNT(DISTINCT regione) as regioni,
        COUNT(DISTINCT provincia) as province,
        COUNT(DISTINCT settore) as settori,
        COUNT(DISTINCT divisione) as divisioni,
        COUNT(DISTINCT classe) as classi,
        COUNT(DISTINCT sottocategoria) as sottocategorie,
        SUM(imprese_attive) as totale_imprese,
        AVG(imprese_attive) as media_imprese,
        MIN(imprese_attive) as min_imprese,
        MAX(imprese_attive) as max_imprese
      FROM imprese
    `);
    
    console.log(`Regioni: ${stats.regioni}`);
    console.log(`Province: ${stats.province}`);
    console.log(`Settori: ${stats.settori}`);
    console.log(`Divisioni: ${stats.divisioni}`);
    console.log(`Classi: ${stats.classi}`);
    console.log(`Sottocategorie: ${stats.sottocategorie}`);
    console.log(`Totale imprese: ${stats.totale_imprese.toLocaleString()}`);
    console.log(`Media imprese per record: ${Math.round(stats.media_imprese)}`);
    console.log(`Min imprese: ${stats.min_imprese}`);
    console.log(`Max imprese: ${stats.max_imprese.toLocaleString()}`);
    
    await database.close();
    
  } catch (error) {
    console.error('❌ Error exploring data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  exploreData().catch(console.error);
}

module.exports = { exploreData };
