// scripts/export-indexes.js
const admin = require('firebase-admin');
const fs = require('fs');

admin.initializeApp();

async function exportIndexes() {
  const indexes = await admin.firestore().getIndexes();
  
  const indexesJson = {
    indexes: indexes.map(index => ({
      collectionGroup: index.collectionGroup,
      queryScope: index.queryScope,
      fields: index.fields
    }))
  };
  
  fs.writeFileSync(
    'firestore.indexes.json',
    JSON.stringify(indexesJson, null, 2)
  );
  
  console.log('✅ Indexes exported to firestore.indexes.json');
}

exportIndexes();