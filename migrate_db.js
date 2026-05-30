const sqlite3 = require('sqlite3').verbose();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const db = new sqlite3.Database('./prisma/dev.db');

function clean(str) {
  if (typeof str === 'string') {
    return str.replace(/\0/g, ''); // Remove null bytes
  }
  return str;
}

db.all("SELECT * FROM Problem", async (err, rows) => {
  if (err) {
    console.error(err);
    return;
  }
  
  console.log(`Found ${rows.length} problems in SQLite. Migrating to Neon Postgres...`);
  
  for (const row of rows) {
    try {
      await prisma.problem.create({
        data: {
          id: row.id,
          title: clean(row.title),
          description: clean(row.description),
          topic: clean(row.topic),
          difficulty: clean(row.difficulty),
          source: clean(row.source),
          solution: clean(row.solution),
          fullSolution: clean(row.fullSolution),
          hint: clean(row.hint),
          createdAt: new Date(row.createdAt),
        }
      });
    } catch(e) {
      console.error("Failed to migrate problem: ", row.id, e.message);
    }
  }
  
  console.log("Migration complete!");
  process.exit(0);
});
