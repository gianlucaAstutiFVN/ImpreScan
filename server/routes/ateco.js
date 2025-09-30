const express = require('express');
const router = express.Router();
const database = require('../config/database');
const ATECOService = require('../services/atecoService');

// Get ATECO codes with filters
router.get('/', async (req, res) => {
  try {
    const {
      level,
      parent_code,
      search,
      limit = 1000,
      offset = 0,
      orderBy = 'code',
      orderDir = 'ASC'
    } = req.query;
    
    let sql = `
      SELECT 
        code,
        name,
        level,
        parent_code,
        description
      FROM ateco_codes
      WHERE 1=1
    `;
    
    const params = [];
    
    if (level) {
      sql += ' AND level = ?';
      params.push(parseInt(level));
    }
    
    if (parent_code) {
      sql += ' AND parent_code = ?';
      params.push(parent_code);
    }
    
    if (search) {
      sql += ' AND (name LIKE ? OR code LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    // Validate orderBy
    const allowedOrderBy = ['code', 'name', 'level', 'parent_code'];
    const validOrderBy = allowedOrderBy.includes(orderBy) ? orderBy : 'code';
    const validOrderDir = orderDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    sql += ` ORDER BY ${validOrderBy} ${validOrderDir} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    const atecoCodes = await database.all(sql, params);
    
    res.json({
      atecoCodes,
      limit: parseInt(limit),
      offset: parseInt(offset),
      filters: {
        level: level ? parseInt(level) : null,
        parent_code,
        search
      }
    });
    
  } catch (error) {
    console.error('Error fetching ATECO codes:', error);
    res.status(500).json({ error: 'Failed to fetch ATECO codes' });
  }
});

// Get ATECO tree structure with company counts
router.get('/tree/:rootCode?', async (req, res) => {
  try {
    const { rootCode } = req.params;
    
    // 1. Recupera tutti i codici ATECO
    let sql = `
      SELECT 
        code,
        name,
        level,
        parent_code,
        description
      FROM ateco_codes
      WHERE 1=1
    `;
    
    const params = [];
    
    if (rootCode) {
      sql += ' AND (code = ? OR code LIKE ?)';
      params.push(rootCode, `${rootCode}%`);
    }
    
    sql += ' ORDER BY code';
    
    const allCodes = await database.all(sql, params);
    
    // 2. Costruisce l'albero
    const tree = ATECOService.buildATECOTree(allCodes, rootCode);
    
    // 3. Calcola i directCompanies e restituisce l'albero con i conteggi
    const treeWithDirectCounts = await ATECOService.calculateCompanyCounts(allCodes, tree);


    // 4. Calcola i totalCompanies basandosi sui directCompanies
    const finalTree = ATECOService.addCompanyCountsToTree(treeWithDirectCounts);
    
    res.json({
      tree: finalTree
    });
    
  } catch (error) {
    console.error('Error fetching ATECO tree:', error);
    res.status(500).json({ error: 'Failed to fetch ATECO tree' });
  }
});

// Get ATECO statistics
router.get('/statistics/summary', async (req, res) => {
  try {
    const stats = await database.get(`
      SELECT 
        COUNT(*) as total_codes,
        COUNT(DISTINCT level) as total_levels,
        MIN(level) as min_level,
        MAX(level) as max_level
      FROM ateco_codes
    `);
    
    const byLevel = await database.all(`
      SELECT 
        level,
        COUNT(*) as count
      FROM ateco_codes
      GROUP BY level
      ORDER BY level
    `);
    
    const topSections = await database.all(`
      SELECT 
        code,
        name,
        COUNT(*) as children_count
      FROM ateco_codes
      WHERE level = 1
      ORDER BY code
    `);
    
    res.json({
      general: stats,
      byLevel,
      topSections
    });
    
  } catch (error) {
    console.error('Error fetching ATECO statistics:', error);
    res.status(500).json({ error: 'Failed to fetch ATECO statistics' });
  }
});

// Get ATECO code by code
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    const atecoCode = await database.get(`
      SELECT 
        code,
        name,
        level,
        parent_code,
        description
      FROM ateco_codes
      WHERE code = ?
    `, [code]);
    
    if (!atecoCode) {
      return res.status(404).json({ error: 'ATECO code not found' });
    }
    
    // Get children if any
    const children = await database.all(`
      SELECT 
        code,
        name,
        level,
        parent_code,
        description
      FROM ateco_codes
      WHERE parent_code = ?
      ORDER BY code
    `, [code]);
    
    // Get parent if any
    let parent = null;
    if (atecoCode.parent_code) {
      parent = await database.get(`
        SELECT 
          code,
          name,
          level,
          parent_code,
          description
        FROM ateco_codes
        WHERE code = ?
      `, [atecoCode.parent_code]);
    }
    
    res.json({
      ...atecoCode,
      children,
      parent
    });
    
  } catch (error) {
    console.error('Error fetching ATECO code:', error);
    res.status(500).json({ error: 'Failed to fetch ATECO code' });
  }
});

module.exports = router;