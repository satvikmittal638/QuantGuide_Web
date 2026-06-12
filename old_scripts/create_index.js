const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Creating GIN index on Problem table...");
  try {
    // Drop it if it exists
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS problem_fts_idx`);
    
    // Create GIN index on the 'english' tsvector of title + description
    await prisma.$executeRawUnsafe(`
      CREATE INDEX problem_fts_idx 
      ON "Problem" 
      USING GIN (to_tsvector('english', title || ' ' || description));
    `);
    
    console.log("Index created successfully!");
  } catch (err) {
    console.error("Error creating index:", err);
  }
}

main().finally(() => prisma.$disconnect());
