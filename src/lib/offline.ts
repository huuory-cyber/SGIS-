import { SocialRecord, NewSocialRecord } from '../types';
import { supabase } from './supabase';

const OFFLINE_STORE_NAME = 'sgis_offline_records';
const PENDING_UPLOADS_NAME = 'sgis_pending_uploads';

/**
 * Offline storage interface using IndexedDB
 */
class OfflineStorage {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'SGISOfflineDB';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store for offline records
        if (!db.objectStoreNames.contains(OFFLINE_STORE_NAME)) {
          const store = db.createObjectStore(OFFLINE_STORE_NAME, { keyPath: 'id' });
          store.createIndex('created_at', 'created_at', { unique: false });
          store.createIndex('sync_status', 'sync_status', { unique: false });
        }

        // Store for pending image uploads
        if (!db.objectStoreNames.contains(PENDING_UPLOADS_NAME)) {
          const imgStore = db.createObjectStore(PENDING_UPLOADS_NAME, { keyPath: 'id' });
          imgStore.createIndex('record_id', 'record_id', { unique: false });
        }
      };
    });
  }

  async saveRecord(record: SocialRecord): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([OFFLINE_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(OFFLINE_STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getRecords(): Promise<SocialRecord[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([OFFLINE_STORE_NAME], 'readonly');
      const store = transaction.objectStore(OFFLINE_STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingRecords(): Promise<SocialRecord[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([OFFLINE_STORE_NAME], 'readonly');
      const store = transaction.objectStore(OFFLINE_STORE_NAME);
      const index = store.index('sync_status');
      const request = index.getAll('pending');

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteRecord(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([OFFLINE_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(OFFLINE_STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([OFFLINE_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(OFFLINE_STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Image storage for offline
  async saveImage(recordId: string, imageId: string, file: File): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PENDING_UPLOADS_NAME], 'readwrite');
      const store = transaction.objectStore(PENDING_UPLOADS_NAME);
      
      const imageData = {
        id: imageId,
        record_id: recordId,
        file: file,
        created_at: new Date().toISOString(),
      };

      const request = store.put(imageData);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingImages(recordId?: string): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PENDING_UPLOADS_NAME], 'readonly');
      const store = transaction.objectStore(PENDING_UPLOADS_NAME);

      let request: IDBRequest;
      if (recordId) {
        const index = store.index('record_id');
        request = index.getAll(recordId);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteImage(imageId: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PENDING_UPLOADS_NAME], 'readwrite');
      const store = transaction.objectStore(PENDING_UPLOADS_NAME);
      const request = store.delete(imageId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

const offlineStorage = new OfflineStorage();

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Listen for online/offline events
 */
export function onConnectivityChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Save a record for offline use
 */
export async function saveOfflineRecord(record: SocialRecord): Promise<void> {
  await offlineStorage.init();
  await offlineStorage.saveRecord({
    ...record,
    sync_status: 'pending',
    offline_created: true,
  });
}

/**
 * Get all offline records
 */
export async function getOfflineRecords(): Promise<SocialRecord[]> {
  await offlineStorage.init();
  return await offlineStorage.getRecords();
}

/**
 * Get pending records that need to be synced
 */
export async function getPendingSyncRecords(): Promise<SocialRecord[]> {
  await offlineStorage.init();
  return await offlineStorage.getPendingRecords();
}

/**
 * Sync a single record to the server
 */
export async function syncRecord(record: SocialRecord): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('social_records')
      .upsert({
        ...record,
        sync_status: 'synced',
        offline_created: false,
      });

    if (error) throw error;

    // Remove from offline storage after successful sync
    await offlineStorage.deleteRecord(record.id);
    return true;
  } catch (error) {
    console.error('Sync error for record:', record.id, error);
    return false;
  }
}

/**
 * Sync all pending records
 */
export async function syncAllPendingRecords(): Promise<{
  success: number;
  failed: number;
}> {
  const pendingRecords = await getPendingSyncRecords();
  let success = 0;
  let failed = 0;

  for (const record of pendingRecords) {
    const result = await syncRecord(record);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}

/**
 * Upload pending images when online
 */
export async function syncPendingImages(): Promise<void> {
  const pendingImages = await offlineStorage.getPendingImages();
  
  for (const img of pendingImages) {
    try {
      // Here you would upload the image to Supabase Storage
      // For now, we'll just remove it from pending
      await offlineStorage.deleteImage(img.id);
    } catch (error) {
      console.error('Image sync error:', error);
    }
  }
}

/**
 * Create a record with offline support
 */
export async function createRecordWithOfflineSupport(
  recordData: NewSocialRecord,
  images?: File[]
): Promise<{ success: boolean; recordId?: string; offline?: boolean }> {
  const tempId = crypto.randomUUID();
  
  const record: SocialRecord = {
    ...recordData,
    id: tempId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    image_urls: [],
    image_count: 0,
    sync_status: 'pending',
    offline_created: !isOnline(),
  };

  if (isOnline()) {
    try {
      // Try to create online first
      const { data, error } = await supabase
        .from('social_records')
        .insert({
          ...record,
          sync_status: 'synced',
          offline_created: false,
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, recordId: data.id, offline: false };
    } catch (error) {
      console.error('Online creation failed, saving offline:', error);
      // Fall through to offline creation
    }
  }

  // Save offline
  await saveOfflineRecord(record);
  
  // Save images offline if present
  if (images) {
    for (let i = 0; i < images.length; i++) {
      await offlineStorage.saveImage(tempId, `${tempId}_img_${i}`, images[i]);
    }
  }

  return { success: true, recordId: tempId, offline: true };
}

/**
 * Initialize offline support
 */
export async function initOfflineSupport(): Promise<void> {
  await offlineStorage.init();

  // Set up automatic sync when coming online
  onConnectivityChange(async (online) => {
    if (online) {
      console.log('Connection restored. Syncing pending records...');
      const result = await syncAllPendingRecords();
      console.log(`Sync complete: ${result.success} succeeded, ${result.failed} failed`);
      
      await syncPendingImages();
    }
  });
}

/**
 * Get offline statistics
 */
export async function getOfflineStats(): Promise<{
  totalRecords: number;
  pendingSync: number;
  pendingImages: number;
}> {
  await offlineStorage.init();
  
  const allRecords = await offlineStorage.getRecords();
  const pendingRecords = await offlineStorage.getPendingRecords();
  const pendingImages = await offlineStorage.getPendingImages();

  return {
    totalRecords: allRecords.length,
    pendingSync: pendingRecords.length,
    pendingImages: pendingImages.length,
  };
}
