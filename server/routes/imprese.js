const express = require('express');
const router = express.Router();
const database = require('../config/database');

// Function to get all ATECO codes that should be included in the filter
// This includes the selected code and all its children in the hierarchy
async function getATECOCodesForFilter(atecoCode) {
  if (!atecoCode) return [];
  
  try {
    // First, check if the code exists in ateco_codes
    const codeInfo = await database.get(`
      SELECT code, level
      FROM ateco_codes 
      WHERE code = ?
    `, [atecoCode]);
    
    if (!codeInfo) {
      console.log(`Code ${atecoCode} not found in ateco_codes`);
      return [];
    }
    
    // CORRECTED LOGIC: Get only the most specific codes (leaf nodes) under this ATECO code
    // This means we want all codes that:
    // 1. Start with the selected code (are children)
    // 2. Are NOT parents of any other code (are leaf nodes)
    // 3. OR are the exact code if it has no children
    
    // First, get all potential children
    const allChildren = await database.all(`
      SELECT code
      FROM ateco_codes 
      WHERE code LIKE ?
      ORDER BY code
    `, [`${atecoCode}%`]);
    
    // Then, find which ones are leaf nodes (have no children)
    const leafNodes = [];
    
    for (const child of allChildren) {
      // Check if this code has any children
      const hasChildren = await database.get(`
        SELECT COUNT(*) as count
        FROM ateco_codes 
        WHERE code LIKE ? AND code != ?
      `, [`${child.code}%`, child.code]);
      
      // If no children, it's a leaf node
      if (hasChildren.count === 0) {
        leafNodes.push(child.code);
      }
    }
    
    // SPECIAL CASE: If the selected code has no children in ateco_codes,
    // we need to find all the actual leaf nodes in the imprese table
    if (leafNodes.length === 1 && leafNodes[0] === atecoCode) {
      // This means the code has no children in the ATECO structure
      // We need to find all the actual leaf nodes in the imprese table
      const actualLeafNodes = await database.all(`
        SELECT DISTINCT sottocategoria
        FROM imprese 
        WHERE settore = ? OR divisione LIKE ? OR classe LIKE ? OR sottocategoria LIKE ?
        ORDER BY sottocategoria
      `, [atecoCode, `${atecoCode}%`, `${atecoCode}%`, `${atecoCode}%`]);
      
      // Filter to get only the most specific ones (those that don't have children)
      const filteredLeafNodes = [];
      for (const node of actualLeafNodes) {
        const hasChildrenInImprese = await database.get(`
          SELECT COUNT(*) as count
          FROM imprese 
          WHERE (settore = ? OR divisione LIKE ? OR classe LIKE ? OR sottocategoria LIKE ?)
          AND sottocategoria != ?
          AND (sottocategoria LIKE ? OR divisione LIKE ? OR classe LIKE ?)
        `, [atecoCode, `${atecoCode}%`, `${atecoCode}%`, `${atecoCode}%`, node.sottocategoria, `${node.sottocategoria}%`, `${node.sottocategoria}%`, `${node.sottocategoria}%`]);
        
        if (hasChildrenInImprese.count === 0) {
          filteredLeafNodes.push(node.sottocategoria);
        }
      }
      
      leafNodes.length = 0; // Clear the array
      leafNodes.push(...filteredLeafNodes);
    }
    
    // Convert ATECO codes format to imprese table format
    // ATECO codes use dots (01.11.0) while imprese table uses no dots (01110)
    const convertedCodes = leafNodes.map(code => {
      // Remove dots and convert to the format used in imprese table
      const cleanCode = code.replace(/\./g, '');
      return cleanCode;
    });
    
    // Also include the original codes in case they match directly
    const originalCodes = leafNodes;
    
    // Combine and deduplicate
    const allCodes = [...new Set([...originalCodes, ...convertedCodes])];
    
    console.log(`ATECO Filter for ${atecoCode}: Found ${allCodes.length} leaf nodes:`, allCodes);
    
    return allCodes;
  } catch (error) {
    console.error('Error getting ATECO codes for filter:', error);
    return [];
  }
}

// Get imprese with filters
router.get('/', async (req, res) => {
  try {
    const {
      regione,
      provincia,
      settore,
      divisione,
      classe,
      sottocategoria,
      minImprese = 0,
      maxImprese = null,
      limit = 1000,
      offset = 0,
      orderBy = 'imprese_attive',
      orderDir = 'DESC'
    } = req.query;
    
    let sql = `
      SELECT 
        i.*,
        a.name as settore_name,
        a.description as settore_description
      FROM imprese i
      LEFT JOIN ateco_codes a ON i.settore = a.code
      WHERE 1=1
    `;
    
    const params = [];
    
    if (regione) {
      sql += ' AND i.regione = ?';
      params.push(regione);
    }
    
    if (provincia) {
      sql += ' AND i.provincia = ?';
      params.push(provincia);
    }
    
    if (settore) {
      // Get all ATECO codes that should be included in the filter
      const atecoCodes = await getATECOCodesForFilter(settore);
      if (atecoCodes.length > 0) {
        // CORRECTED LOGIC: Only match against the most specific field (sottocategoria)
        // because that's where the actual company counts are stored
        const placeholders = atecoCodes.map(() => '?').join(',');
        sql += ` AND i.sottocategoria IN (${placeholders})`;
        params.push(...atecoCodes);
      } else {
        // If no codes found, return empty result
        sql += ' AND 1=0';
      }
    }
    
    if (divisione) {
      sql += ' AND i.divisione = ?';
      params.push(divisione);
    }
    
    if (classe) {
      sql += ' AND i.classe = ?';
      params.push(classe);
    }
    
    if (sottocategoria) {
      sql += ' AND i.sottocategoria = ?';
      params.push(sottocategoria);
    }
    
    if (minImprese > 0) {
      sql += ' AND i.imprese_attive >= ?';
      params.push(parseInt(minImprese));
    }
    
    if (maxImprese) {
      sql += ' AND i.imprese_attive <= ?';
      params.push(parseInt(maxImprese));
    }
    
    // Validate orderBy
    const allowedOrderBy = ['imprese_attive', 'regione', 'provincia', 'settore', 'divisione', 'classe', 'sottocategoria'];
    const validOrderBy = allowedOrderBy.includes(orderBy) ? orderBy : 'imprese_attive';
    const validOrderDir = orderDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    sql += ` ORDER BY i.${validOrderBy} ${validOrderDir} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    const imprese = await database.all(sql, params);
    
    // Get regional breakdown
    let regionalSql = `
      SELECT 
        i.regione,
        SUM(i.imprese_attive) as total_imprese
      FROM imprese i
      WHERE 1=1
    `;
    const regionalParams = [];
    
    if (regione) {
      regionalSql += ' AND i.regione = ?';
      regionalParams.push(regione);
    }
    
    if (provincia) {
      regionalSql += ' AND i.provincia = ?';
      regionalParams.push(provincia);
    }
    
    if (settore) {
      // Get all ATECO codes that should be included in the filter
      const atecoCodes = await getATECOCodesForFilter(settore);
      if (atecoCodes.length > 0) {
        // CORRECTED LOGIC: Only match against the most specific field (sottocategoria)
        const placeholders = atecoCodes.map(() => '?').join(',');
        regionalSql += ` AND i.sottocategoria IN (${placeholders})`;
        regionalParams.push(...atecoCodes);
      } else {
        // If no codes found, return empty result
        regionalSql += ' AND 1=0';
      }
    }
    
    if (divisione) {
      regionalSql += ' AND i.divisione = ?';
      regionalParams.push(divisione);
    }
    
    if (classe) {
      regionalSql += ' AND i.classe = ?';
      regionalParams.push(classe);
    }
    
    if (sottocategoria) {
      regionalSql += ' AND i.sottocategoria = ?';
      regionalParams.push(sottocategoria);
    }
    
    if (minImprese > 0) {
      regionalSql += ' AND i.imprese_attive >= ?';
      regionalParams.push(parseInt(minImprese));
    }
    
    if (maxImprese) {
      regionalSql += ' AND i.imprese_attive <= ?';
      regionalParams.push(parseInt(maxImprese));
    }
    
    regionalSql += ' GROUP BY i.regione ORDER BY total_imprese DESC';
    
    const regionalBreakdown = await database.all(regionalSql, regionalParams);
    
    res.json({
      imprese,
      regionalBreakdown,
      filters: {
        regione,
        provincia,
        settore,
        divisione,
        classe,
        sottocategoria,
        minImprese: parseInt(minImprese),
        maxImprese: maxImprese ? parseInt(maxImprese) : null
      }
    });
    
  } catch (error) {
    console.error('Error fetching imprese:', error);
    res.status(500).json({ error: 'Failed to fetch imprese' });
  }
});

// Get statistics
router.get('/statistics', async (req, res) => {
  try {
    const { regione, provincia, settore, divisione, classe } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (regione) {
      whereClause += ' AND regione = ?';
      params.push(regione);
    }
    
    if (provincia) {
      whereClause += ' AND provincia = ?';
      params.push(provincia);
    }
    
    if (settore) {
      // Get all ATECO codes that should be included in the filter
      const atecoCodes = await getATECOCodesForFilter(settore);
      if (atecoCodes.length > 0) {
        // CORRECTED LOGIC: Only match against the most specific field (sottocategoria)
        const placeholders = atecoCodes.map(() => '?').join(',');
        whereClause += ` AND sottocategoria IN (${placeholders})`;
        params.push(...atecoCodes);
      } else {
        // If no codes found, return empty result
        whereClause += ' AND 1=0';
      }
    }
    
    if (divisione) {
      whereClause += ' AND divisione = ?';
      params.push(divisione);
    }
    
    if (classe) {
      whereClause += ' AND classe = ?';
      params.push(classe);
    }
    
    // General statistics
    const generalStats = await database.get(`
      SELECT 
        SUM(imprese_attive) as total_imprese,
        AVG(imprese_attive) as avg_imprese,
        MIN(imprese_attive) as min_imprese,
        MAX(imprese_attive) as max_imprese
      FROM imprese
      ${whereClause}
    `, params);
    
    // By region
    const regionStats = await database.all(`
      SELECT 
        regione,
        SUM(imprese_attive) as total_imprese,
        AVG(imprese_attive) as avg_imprese
      FROM imprese
      ${whereClause}
      GROUP BY regione
      ORDER BY total_imprese DESC
      LIMIT 20
    `, params);
    
    // By sector
    const sectorStats = await database.all(`
      SELECT 
        settore,
        SUM(imprese_attive) as total_imprese,
        AVG(imprese_attive) as avg_imprese
      FROM imprese
      ${whereClause}
      GROUP BY settore
      ORDER BY total_imprese DESC
      LIMIT 20
    `, params);
    
    // By province
    const provinceStats = await database.all(`
      SELECT 
        provincia,
        regione,
        SUM(imprese_attive) as total_imprese
      FROM imprese
      ${whereClause}
      GROUP BY provincia, regione
      ORDER BY total_imprese DESC
      LIMIT 20
    `, params);
    
    res.json({
      general: generalStats,
      byRegion: regionStats,
      bySector: sectorStats,
      byProvince: provinceStats,
      filters: {
        regione,
        provincia,
        settore,
        divisione,
        classe
      }
    });
    
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get filter options
router.get('/filter-options', async (req, res) => {
  try {
    const options = {};
    
    // Regions
    const regioni = await database.all(`
      SELECT DISTINCT regione, SUM(imprese_attive) as total_imprese
      FROM imprese
      GROUP BY regione
      ORDER BY regione
    `);
    options.regioni = regioni;
    
    // Provinces
    const province = await database.all(`
      SELECT DISTINCT provincia, regione, SUM(imprese_attive) as total_imprese
      FROM imprese
      GROUP BY provincia, regione
      ORDER BY regione, provincia
    `);
    options.province = province;
    
    // Sectors
    const settori = await database.all(`
      SELECT DISTINCT i.settore, SUM(i.imprese_attive) as total_imprese, a.name as settore_name
      FROM imprese i
      LEFT JOIN ateco_codes a ON i.settore = a.code
      GROUP BY i.settore
      ORDER BY i.settore
    `);
    options.settori = settori;
    
    // Divisions
    const divisioni = await database.all(`
      SELECT DISTINCT i.divisione, SUM(i.imprese_attive) as total_imprese, a.name as divisione_name
      FROM imprese i
      LEFT JOIN ateco_codes a ON i.divisione = a.code
      GROUP BY i.divisione
      ORDER BY i.divisione
    `);
    options.divisioni = divisioni;
    
    // Classes
    const classi = await database.all(`
      SELECT DISTINCT i.classe, SUM(i.imprese_attive) as total_imprese, a.name as classe_name
      FROM imprese i
      LEFT JOIN ateco_codes a ON i.classe = a.code
      GROUP BY i.classe
      ORDER BY i.classe
    `);
    options.classi = classi;
    
    // Subcategories
    const sottocategorie = await database.all(`
      SELECT DISTINCT i.sottocategoria, SUM(i.imprese_attive) as total_imprese, a.name as sottocategoria_name
      FROM imprese i
      LEFT JOIN ateco_codes a ON i.sottocategoria = a.code
      GROUP BY i.sottocategoria
      ORDER BY i.sottocategoria
    `);
    options.sottocategorie = sottocategorie;
    
    res.json(options);
    
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
});

// Get map data (aggregated by province)
router.get('/map-data', async (req, res) => {
  try {
    const { 
      regione, 
      settore, 
      divisione, 
      classe, 
      minImprese = 0,
      maxImprese = null 
    } = req.query;
    
    let sql = `
      SELECT 
        provincia,
        regione,
        SUM(imprese_attive) as total_imprese,
        AVG(imprese_attive) as avg_imprese,
        MIN(imprese_attive) as min_imprese,
        MAX(imprese_attive) as max_imprese
      FROM imprese
      WHERE 1=1
    `;
    
    const params = [];
    
    if (regione) {
      sql += ' AND regione = ?';
      params.push(regione);
    }
    
    if (settore) {
      // Get all ATECO codes that should be included in the filter
      const atecoCodes = await getATECOCodesForFilter(settore);
      if (atecoCodes.length > 0) {
        // CORRECTED LOGIC: Only match against the most specific field (sottocategoria)
        const placeholders = atecoCodes.map(() => '?').join(',');
        sql += ` AND sottocategoria IN (${placeholders})`;
        params.push(...atecoCodes);
      } else {
        // If no codes found, return empty result
        sql += ' AND 1=0';
      }
    }
    
    if (divisione) {
      sql += ' AND divisione = ?';
      params.push(divisione);
    }
    
    if (classe) {
      sql += ' AND classe = ?';
      params.push(classe);
    }
    
    sql += ' GROUP BY provincia, regione';
    
    // Filters for number of companies
    if (minImprese > 0 || maxImprese) {
      sql += ' HAVING 1=1';
      if (minImprese > 0) {
        sql += ' AND total_imprese >= ?';
        params.push(parseInt(minImprese));
      }
      if (maxImprese) {
        sql += ' AND total_imprese <= ?';
        params.push(parseInt(maxImprese));
      }
    }
    
    sql += ' ORDER BY total_imprese DESC';
    
    const mapData = await database.all(sql, params);
    
    res.json({
      data: mapData,
      filters: {
        regione,
        settore,
        divisione,
        classe,
        minImprese: parseInt(minImprese),
        maxImprese: maxImprese ? parseInt(maxImprese) : null
      }
    });
    
  } catch (error) {
    console.error('Error fetching map data:', error);
    res.status(500).json({ error: 'Failed to fetch map data' });
  }
});

// Export the function for testing
module.exports = { router, getATECOCodesForFilter };
