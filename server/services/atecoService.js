const database = require('../config/database');

class ATECOService {
  
  /**
   * Calcola i conteggi aziendali per l'albero ATECO e restituisce l'albero con i conteggi
   */
  static async calculateCompanyCounts(atecoCodes, tree) {
    // Funzione ricorsiva per ciclare l'albero e calcolare i directCompanies
    async function processNode(node) {
      try {
        let directCompanies = 0;
        
        // Nel database ISTAT, le imprese possono essere classificate a qualsiasi livello
        // Rimuovi i punti dal codice per la query al database
        const cleanCode = node.code.replace(/\./g, '');
        
        if (cleanCode.length === 1) {
          // Settore (A, B, C, etc.)
          const result = await database.get(`
            SELECT SUM(imprese_attive) as total
            FROM imprese 
            WHERE settore = ?
          `, [cleanCode]);
          directCompanies = result?.total || 0;
        } else if (cleanCode.length === 2) {
          // Divisione (01, 02, etc.)
          const result = await database.get(`
            SELECT SUM(imprese_attive) as total
            FROM imprese 
            WHERE divisione = ?
          `, [cleanCode]);
          directCompanies = result?.total || 0;
        } else if (cleanCode.length === 3) {
          // Classe (011, 012, etc.)
          const result = await database.get(`
            SELECT SUM(imprese_attive) as total
            FROM imprese 
            WHERE classe = ?
          `, [cleanCode]);
          directCompanies = result?.total || 0;
        } else if (cleanCode.length >= 4) {
          // Sottocategoria (011100, 011311, etc.)
          const result = await database.get(`
            SELECT SUM(imprese_attive) as total
            FROM imprese 
            WHERE sottocategoria = ?
          `, [cleanCode]);
          directCompanies = result?.total || 0;
        }
        
        // Aggiungi directCompanies al nodo
        node.directCompanies = directCompanies;
        
        // Processa ricorsivamente i figli
        if (node.children && node.children.length > 0) {
          for (const child of node.children) {
            await processNode(child);
          }
        }
        
      } catch (error) {
        console.error(`Error calculating count for ${node.code}:`, error);
        node.directCompanies = 0;
      }
    }
    
    // Processa tutti i nodi radice dell'albero
    for (const rootNode of tree) {
      await processNode(rootNode);
    }
    
    return tree;
  }
  
  /**
   * Calcola i totalCompanies per l'albero (i directCompanies devono essere già presenti)
   * Logica corretta secondo i requisiti:
   * - directCompanies = già calcolato nel metodo calculateCompanyCounts
   * - totalCompanies = somma dei directCompanies di tutti i figli (non include le imprese dirette del nodo stesso)
   */
  static addCompanyCountsToTree(nodes) {
    function processNode(node) {
      // 1. Inizializza totali
      node.totalCompanies = 0;
      node.leafNodes = 0;
      
      // 2. Processa i figli PRIMA per calcolare i loro conteggi
      if (node.children && node.children.length > 0) {
        let childrenDirectTotal = 0; // Somma dei directCompanies di tutti i figli
        let childrenLeafNodes = 0;
        
        for (const child of node.children) {
          processNode(child); // Calcola ricorsivamente
          childrenDirectTotal += child.directCompanies; // Somma i direct dei figli
          childrenLeafNodes += child.leafNodes;
        }
        
        // 3. totalCompanies = somma dei directCompanies di tutti i figli
        // NON include le imprese dirette del nodo stesso
        node.totalCompanies = childrenDirectTotal;
        node.leafNodes = childrenLeafNodes;
      } else {
        // 4. Nodo foglia: totalCompanies = 0 (nessun figlio)
        node.totalCompanies = 0;
        node.leafNodes = node.directCompanies > 0 ? 1 : 0;
      }
    }
    
    // Processa tutti i nodi radice
    for (const node of nodes) {
      processNode(node);
    }
    
    return nodes;
  }
  
  /**
   * Costruisce l'albero ATECO
   */
  static buildATECOTree(codes, rootCode = null) {
    const codeMap = new Map();
    const roots = [];
    
    // Funzione per aggiungere i punti ai codici
    function addDotsToCode(code) {
      if (!code) return code;
      
      // Se il codice ha già i punti, non fare nulla
      if (code.includes('.')) return code;
      
      // Aggiungi i punti in base alla lunghezza
      if (code.length === 2) {
        return code.substring(0, 1) + '.' + code.substring(1);
      } else if (code.length === 3) {
        return code.substring(0, 2) + '.' + code.substring(2);
      } else if (code.length === 4) {
        return code.substring(0, 2) + '.' + code.substring(2, 3) + '.' + code.substring(3);
      } else if (code.length === 5) {
        return code.substring(0, 2) + '.' + code.substring(2, 3) + '.' + code.substring(3, 4) + '.' + code.substring(4);
      } else if (code.length === 6) {
        return code.substring(0, 2) + '.' + code.substring(2, 3) + '.' + code.substring(3, 5) + '.' + code.substring(5);
      }
      
      return code;
    }
    
    // Crea mappa di tutti i codici con i punti aggiunti
    codes.forEach(code => {
      const codeWithDots = addDotsToCode(code.code);
      const parentCodeWithDots = code.parent_code ? addDotsToCode(code.parent_code) : null;
      
      codeMap.set(code.code, { 
        ...code, 
        code: codeWithDots,
        parent_code: parentCodeWithDots,
        children: [] 
      });
    });
    
    // Costruisce la gerarchia padre-figlio
    codes.forEach(code => {
      const node = codeMap.get(code.code);
      
      if (code.parent_code && codeMap.has(code.parent_code)) {
        // Ha un padre: aggiunge come figlio
        const parent = codeMap.get(code.parent_code);
        parent.children.push(node);
      } else {
        // È un nodo radice
        if (!rootCode || code.code === rootCode) {
          roots.push(node);
        }
      }
    });
    
    return roots;
  }
}

module.exports = ATECOService;

