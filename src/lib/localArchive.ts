export interface ArchivedImageMeta {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: number;
  status: 'archived' | 'processed' | 'error';
  ocrText?: string;
  ocrProcessedAt?: number;
}

interface ArchivedImageRecord extends ArchivedImageMeta {
  blob: Blob;
}

const DB_NAME = 'tsunami-local-archive';
const STORE_NAME = 'images';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => Promise<T>): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    fn(store)
      .then((result) => {
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
      })
      .catch(reject);
  });
}

export async function saveImageToArchive(file: File): Promise<ArchivedImageMeta> {
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const record: ArchivedImageRecord = {
    id,
    name: file.name,
    type: file.type,
    size: file.size,
    createdAt: Date.now(),
    status: 'archived',
    blob: file
  };
  await withStore('readwrite', async (store) => {
    return new Promise<void>((resolve, reject) => {
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });
  return {
    id: record.id,
    name: record.name,
    type: record.type,
    size: record.size,
    createdAt: record.createdAt,
    status: record.status
  };
}

export async function listArchivedImages(): Promise<ArchivedImageMeta[]> {
  return withStore('readonly', async (store) => {
    return new Promise<ArchivedImageMeta[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const items = (req.result as ArchivedImageRecord[]).map((r) => ({
          id: r.id,
          name: r.name,
          type: r.type,
          size: r.size,
          createdAt: r.createdAt,
          status: r.status,
          ocrText: r.ocrText,
          ocrProcessedAt: r.ocrProcessedAt,
        }));
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  });
}

export async function getArchivedImage(id: string): Promise<{ blob: Blob; meta: ArchivedImageMeta } | null> {
  return withStore('readonly', async (store) => {
    return new Promise<{ blob: Blob; meta: ArchivedImageMeta } | null>((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => {
        const r = req.result as ArchivedImageRecord | undefined;
        if (!r) return resolve(null);
        resolve({
          blob: r.blob,
          meta: {
            id: r.id,
            name: r.name,
            type: r.type,
            size: r.size,
            createdAt: r.createdAt,
            status: r.status,
            ocrText: r.ocrText,
            ocrProcessedAt: r.ocrProcessedAt,
          }
        });
      };
      req.onerror = () => reject(req.error);
    });
  });
}

export async function deleteArchivedImage(id: string): Promise<void> {
  return withStore('readwrite', async (store) => {
    return new Promise<void>((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });
}

export async function clearArchive(): Promise<void> {
  return withStore('readwrite', async (store) => {
    return new Promise<void>((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });
}

export async function estimateStorage(): Promise<{ usage?: number; quota?: number } | null> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const { usage, quota } = await navigator.storage.estimate();
      return { usage, quota };
    }
    return null;
  } catch {
    return null;
  }
}

export async function updateImageMeta(id: string, updates: Partial<ArchivedImageMeta>): Promise<void> {
  return withStore('readwrite', async (store) => {
    return new Promise<void>((resolve, reject) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const existing = getReq.result as ArchivedImageRecord | undefined;
        if (!existing) return resolve();
        const updated: ArchivedImageRecord = { ...existing, ...updates } as ArchivedImageRecord;
        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  });
}

export async function replaceArchivedImage(id: string, file: File): Promise<ArchivedImageMeta | null> {
  return withStore('readwrite', async (store) => {
    return new Promise<ArchivedImageMeta | null>((resolve, reject) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const existing = getReq.result as ArchivedImageRecord | undefined;
        if (!existing) return resolve(null);
        const updated: ArchivedImageRecord = {
          ...existing,
          name: file.name,
          type: file.type,
          size: file.size,
          // keep original createdAt
          blob: file,
          status: 'archived',
        };
        const putReq = store.put(updated);
        putReq.onsuccess = () => {
          resolve({
            id: updated.id,
            name: updated.name,
            type: updated.type,
            size: updated.size,
            createdAt: updated.createdAt,
            status: updated.status,
            ocrText: updated.ocrText,
            ocrProcessedAt: updated.ocrProcessedAt,
          });
        };
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  });
}
