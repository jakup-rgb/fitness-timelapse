import { openDB, type DBSchema } from "idb";

export type PhotoEntry = {
  id: string;
  date: string; // ISO String
  blob: Blob;
};

interface FitnessDB extends DBSchema {
  photos: {
    key: string;
    value: PhotoEntry;
    indexes: { "by-date": string };
  };
}

const DB_NAME = "fitness_timelapse_db";
const DB_VERSION = 1;

function makeId() {
  // in modernen Browsern verfügbar
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

async function getDB() {
  return openDB<FitnessDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore("photos", { keyPath: "id" });
      store.createIndex("by-date", "date");
    },
  });
}

export async function addPhoto(blob: Blob): Promise<PhotoEntry> {
  const db = await getDB();
  const entry: PhotoEntry = {
    id: makeId(),
    date: new Date().toISOString(),
    blob,
  };
  await db.put("photos", entry);
  return entry;
}

export async function getAllPhotos(): Promise<PhotoEntry[]> {
  const db = await getDB();
  const all = await db.getAll("photos");
  // sortiert: neueste -> älteste
  all.sort((a, b) => b.date.localeCompare(a.date));
  return all;
}
export async function deletePhoto(id: string): Promise<void> {
    const db = await getDB();
    await db.delete("photos", id);
  }
  