/**
 * 数据库初始化脚本
 * 用于创建必要的集合和索引
 */

const fs = require('fs');

const COLLECTIONS = [
  {
    name: 'orders',
    description: '订单表',
    indexes: [
      { name: 'status', fields: ['status'] },
      { name: 'sellerOpenid', fields: ['sellerOpenid'] },
      { name: 'riderOpenid', fields: ['riderOpenid'] },
      { name: 'createdAt', fields: ['createdAt'] }
    ]
  },
  {
    name: 'users',
    description: '用户表',
    indexes: [
      { name: '_openid', fields: ['_openid'] },
      { name: 'role', fields: ['role'] },
      { name: 'campus', fields: ['campus'] }
    ]
  },
  {
    name: 'riders',
    description: '骑手表',
    indexes: [
      { name: '_openid', fields: ['_openid'] },
      { name: 'status', fields: ['status'] }
    ]
  },
  {
    name: 'boxes',
    description: '盲盒表',
    indexes: [
      { name: 'status', fields: ['status'] },
      { name: 'sellerId', fields: ['sellerId'] },
      { name: 'category', fields: ['category'] }
    ]
  },
  {
    name: 'deliveries',
    description: '配送记录表',
    indexes: [
      { name: 'orderId', fields: ['orderId'] },
      { name: 'riderOpenid', fields: ['riderOpenid'] },
      { name: 'status', fields: ['status'] }
    ]
  },
  {
    name: 'notifications',
    description: '通知表',
    indexes: [
      { name: 'receiverOpenid', fields: ['receiverOpenid'] },
      { name: 'isRead', fields: ['isRead'] },
      { name: 'createdAt', fields: ['createdAt'] }
    ]
  },
  {
    name: 'walletRecords',
    description: '钱包记录表',
    indexes: [
      { name: 'userId', fields: ['userId'] },
      { name: 'type', fields: ['type'] },
      { name: 'createdAt', fields: ['createdAt'] }
    ]
  },
  {
    name: 'community',
    description: '社区动态表',
    indexes: [
      { name: 'userId', fields: ['userId'] },
      { name: 'createdAt', fields: ['createdAt'] }
    ]
  }
];

function generateSchema() {
  console.log('📝 生成数据库schema...');
  
  const schema = {
    collections: COLLECTIONS,
    createdAt: new Date().toISOString(),
    version: '1.0.0'
  };
  
  fs.writeFileSync('./db-schema.json', JSON.stringify(schema, null, 2));
  console.log('✓ db-schema.json 已生成');
}

function generateCloudFunctionIndex() {
  console.log('📋 生成云函数索引...');
  
  const functions = [];
  const cloudfunctionsDir = './cloudfunctions';
  
  if (fs.existsSync(cloudfunctionsDir)) {
    const dirs = fs.readdirSync(cloudfunctionsDir, { withFileTypes: true });
    
    dirs.forEach(dir => {
      if (dir.isDirectory() && fs.existsSync(`${cloudfunctionsDir}/${dir.name}/index.js`)) {
        functions.push({
          name: dir.name,
          path: `${cloudfunctionsDir}/${dir.name}`,
          hasPackageJson: fs.existsSync(`${cloudfunctionsDir}/${dir.name}/package.json`)
        });
      }
    });
  }
  
  const index = {
    totalFunctions: functions.length,
    functions,
    createdAt: new Date().toISOString()
  };
  
  fs.writeFileSync('./cloudfunctions-index.json', JSON.stringify(index, null, 2));
  console.log(`✓ cloudfunctions-index.json 已生成 (${functions.length} 个云函数)`);
}

function showInstructions() {
  console.log('\n🗄️ 数据库配置说明:');
  console.log('===========================================');
  console.log('请在云开发控制台执行以下操作:');
  console.log('1. 进入"数据库"面板');
  console.log('2. 创建以下集合:');
  
  COLLECTIONS.forEach(col => {
    console.log(`   - ${col.name} (${col.description})`);
  });
  
  console.log('\n3. 创建索引:');
  COLLECTIONS.forEach(col => {
    if (col.indexes && col.indexes.length > 0) {
      console.log(`\n   ${col.name}:`);
      col.indexes.forEach(idx => {
        console.log(`     - ${idx.name}: ${idx.fields.join(', ')}`);
      });
    }
  });
  
  console.log('\n===========================================');
}

function main() {
  console.log('\n===========================================');
  console.log('   数据库初始化配置工具');
  console.log('===========================================');
  
  generateSchema();
  generateCloudFunctionIndex();
  showInstructions();
  
  console.log('\n✅ 数据库配置文件已生成！');
  console.log('请按照上述说明在云开发控制台配置数据库');
}

if (require.main === module) {
  main();
}

module.exports = {
  COLLECTIONS,
  generateSchema,
  generateCloudFunctionIndex,
  showInstructions
};
