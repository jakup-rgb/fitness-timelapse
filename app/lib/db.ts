import { openDB, type DBSchema } from "idb";

export type PhotoEntry = {
  id: string;
  date: string; // ISO String (UTC)
  blob: Blob;
};

export type NoteEntry = {
  day: string; // "YYYY-MM-DD" (lokal)
  text: string;
  updatedAt: string; // ISO
};

interface FitnessDB extends DBSchema {
  photos: {
    key: string;
    value: PhotoEntry;
    indexes: { "by-date": string };
  };
  notes: {
    key: string; // dayKey "YYYY-MM-DD"
    value: NoteEntry;
    indexes: { "by-updated": string };
  };
}

const DB_NAME = "fitness_timelapse_db";
const DB_VERSION = 2;

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

async function getDB() {
  return openDB<FitnessDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // v1: photos
      if (oldVersion < 1) {
        const store = db.createObjectStore("photos", { keyPath: "id" });
        store.createIndex("by-date", "date");
      } else if (!db.objectStoreNames.contains("photos")) {
        const store = db.createObjectStore("photos", { keyPath: "id" });
        store.createIndex("by-date", "date");
      }

      // v2: notes
      if (oldVersion < 2) {
        const notes = db.createObjectStore("notes", { keyPath: "day" });
        notes.createIndex("by-updated", "updatedAt");
      } else if (!db.objectStoreNames.contains("notes")) {
        const notes = db.createObjectStore("notes", { keyPath: "day" });
        notes.createIndex("by-updated", "updatedAt");
      }
    },
  });
}

// -------------------- Photos --------------------

export async function addPhoto(blob: Blob, dateISO?: string): Promise<PhotoEntry> {
  const db = await getDB();
  const entry: PhotoEntry = {
    id: makeId(),
    date: dateISO ?? new Date().toISOString(),
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

// -------------------- Notes (pro Tag) --------------------

export async function upsertNote(day: string, text: string): Promise<NoteEntry> {
  const db = await getDB();
  const entry: NoteEntry = {
    day,
    text,
    updatedAt: new Date().toISOString(),
  };
  await db.put("notes", entry);
  return entry;
}

export async function getNote(day: string): Promise<NoteEntry | undefined> {
  const db = await getDB();
  return db.get("notes", day);
}

export async function deleteNote(day: string): Promise<void> {
  const db = await getDB();
  await db.delete("notes", day);
}

export async function getAllNotes(): Promise<NoteEntry[]> {
  const db = await getDB();
  const all = await db.getAll("notes");
  all.sort((a, b) => b.day.localeCompare(a.day));
  return all;
}
