const database = require('./config/database');

async function testTree() {
  try {
    await database.connect();
    console.log('✅ Database connected');
    
    // Test the same query as the tree endpoint
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
    
    sql += ' ORDER BY code';
    
    console.log('🔍 Running query:', sql);
    console.log('📊 Parameters:', params);
    
    const allCodes = await database.all(sql, params);
    console.log(`📋 Found ${allCodes.length} codes`);
    
    if (allCodes.length > 0) {
      console.log('📝 First 5 codes:');
      allCodes.slice(0, 5).forEach(code => {
        console.log(`  ${code.code} - ${code.name} (level ${code.level}, parent: ${code.parent_code})`);
      });
      
      // Test tree building
      const tree = buildATECOTree(allCodes, null);
      console.log(`🌳 Tree has ${tree.length} root nodes`);
      
      if (tree.length > 0) {
        console.log('🌳 First root node:', tree[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

// Copy the buildATECOTree function
function buildATECOTree(codes, rootCode = null) {
  const codeMap = new Map();
  const roots = [];
  
  // Create map of all codes
  codes.forEach(code => {
    codeMap.set(code.code, { ...code, children: [] });
  });
  
  // Build tree structure
  codes.forEach(code => {
    const node = codeMap.get(code.code);
    
    if (code.parent_code && codeMap.has(code.parent_code)) {
      const parent = codeMap.get(code.parent_code);
      parent.children.push(node);
    } else {
      // This is a root node
      if (!rootCode || code.code === rootCode) {
        roots.push(node);
      }
    }
  });
  
  return roots;
}

testTree();
