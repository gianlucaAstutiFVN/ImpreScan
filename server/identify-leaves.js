const database = require('./config/database');

async function identifyLeafNodes() {
  try {
    await database.connect();
    console.log('Database connected');
    
    console.log('=== IDENTIFICAZIONE LEAF NODES ===\n');
    
    // Prima, vediamo tutti i codici unici nel dataset
    const allCodes = await database.all(`
      SELECT DISTINCT 
        settore,
        divisione,
        classe,
        sottocategoria,
        SUM(imprese_attive) as total_imprese
      FROM imprese 
      WHERE settore = 'A'
      GROUP BY settore, divisione, classe, sottocategoria
      ORDER BY settore, divisione, classe, sottocategoria
    `);
    
    console.log(`Trovati ${allCodes.length} codici unici nel dataset`);
    
    // Ora identifichiamo i leaf nodes
    const leafNodes = [];
    const nonLeafNodes = [];
    
    for (const code of allCodes) {
      const codeString = `${code.settore}|${code.divisione}|${code.classe}|${code.sottocategoria}`;
      
      // Controlla se questo codice ha figli
      const hasChildren = await database.get(`
        SELECT COUNT(*) as count
        FROM imprese 
        WHERE settore = ? 
        AND (
          (divisione LIKE ? AND divisione != ?) OR
          (classe LIKE ? AND classe != ?) OR
          (sottocategoria LIKE ? AND sottocategoria != ?)
        )
        GROUP BY settore, divisione, classe, sottocategoria
        LIMIT 1
      `, [
        code.settore,
        `${code.divisione}%`, code.divisione,
        `${code.classe}%`, code.classe,
        `${code.sottocategoria}%`, code.sottocategoria
      ]);
      
      if (hasChildren && hasChildren.count > 0) {
        nonLeafNodes.push({
          ...code,
          codeString,
          type: 'non-leaf'
        });
      } else {
        leafNodes.push({
          ...code,
          codeString,
          type: 'leaf'
        });
      }
    }
    
    console.log(`\nLeaf nodes: ${leafNodes.length}`);
    console.log(`Non-leaf nodes: ${nonLeafNodes.length}`);
    
    console.log('\n=== ESEMPI LEAF NODES ===');
    leafNodes.slice(0, 10).forEach(node => {
      console.log(`${node.codeString} | ${node.total_imprese} imprese`);
    });
    
    console.log('\n=== ESEMPI NON-LEAF NODES ===');
    nonLeafNodes.slice(0, 10).forEach(node => {
      console.log(`${node.codeString} | ${node.total_imprese} imprese`);
    });
    
    // Calcola il totale delle imprese per i leaf nodes
    const totalLeafImprese = leafNodes.reduce((sum, node) => sum + node.total_imprese, 0);
    const totalNonLeafImprese = nonLeafNodes.reduce((sum, node) => sum + node.total_imprese, 0);
    
    console.log(`\n=== TOTALE IMPRESE ===`);
    console.log(`Leaf nodes: ${totalLeafImprese.toLocaleString()} imprese`);
    console.log(`Non-leaf nodes: ${totalNonLeafImprese.toLocaleString()} imprese`);
    console.log(`Totale: ${(totalLeafImprese + totalNonLeafImprese).toLocaleString()} imprese`);
    
  } catch (error) {
    console.error('Errore:', error);
  } finally {
    process.exit(0);
  }
}

identifyLeafNodes();
