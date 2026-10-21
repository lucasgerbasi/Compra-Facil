import type { SQLiteDatabase } from 'expo-sqlite';
import type { Food, FoodInput } from '@/types/food';

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS foods (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      notes TEXT,
      updated_at TEXT NOT NULL
    );
  `);
}

export async function getFoods(db: SQLiteDatabase): Promise<Food[]> {
  return db.getAllAsync<Food>('SELECT * FROM foods ORDER BY expires_at ASC, name ASC');
}

export async function getFood(db: SQLiteDatabase, id: string): Promise<Food | null> {
  return db.getFirstAsync<Food>('SELECT * FROM foods WHERE id = ?', id);
}

export async function saveFood(db: SQLiteDatabase, food: FoodInput) {
  await db.runAsync(
    `INSERT INTO foods (id, name, category, quantity, unit, expires_at, notes, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name,
       category=excluded.category,
       quantity=excluded.quantity,
       unit=excluded.unit,
       expires_at=excluded.expires_at,
       notes=excluded.notes,
       updated_at=excluded.updated_at`,
    food.id,
    food.name,
    food.category,
    food.quantity,
    food.unit,
    food.expires_at,
    food.notes,
    new Date().toISOString(),
  );
}

export async function deleteFood(db: SQLiteDatabase, id: string) {
  await db.runAsync('DELETE FROM foods WHERE id = ?', id);
}

export async function replaceFoods(db: SQLiteDatabase, foods: Food[]) {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM foods');
    for (const food of foods) {
      await db.runAsync(
        `INSERT INTO foods (id, name, category, quantity, unit, expires_at, notes, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        food.id, food.name, food.category, food.quantity, food.unit, food.expires_at, food.notes, food.updated_at,
      );
    }
  });
}
