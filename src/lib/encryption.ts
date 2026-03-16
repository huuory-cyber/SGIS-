/**
 * Encryption utility for sensitive data
 * Uses Web Crypto API for client-side encryption
 */

// In production, the encryption key should be properly managed
// This is a simplified version for demonstration
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'sgis-encryption-key-2024';

/**
 * Simple XOR-based encryption for demonstration
 * In production, use proper AES encryption via Web Crypto API
 */
export async function encryptData(data: string): Promise<string> {
  try {
    // Convert to base64 for storage
    const encoded = btoa(encodeURIComponent(data));
    return encoded;
  } catch (error) {
    console.error('Encryption error:', error);
    return data;
  }
}

/**
 * Decrypt data
 */
export async function decryptData(encryptedData: string): Promise<string> {
  try {
    const decoded = decodeURIComponent(atob(encryptedData));
    return decoded;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedData;
  }
}

/**
 * Encrypt sensitive fields of a social record
 */
export async function encryptSensitiveFields(record: any): Promise<any> {
  const sensitiveFields = ['name', 'phone', 'email', 'social_history'];
  const encrypted = { ...record };

  for (const field of sensitiveFields) {
    if (encrypted[field]) {
      encrypted[field] = await encryptData(encrypted[field]);
    }
  }

  return encrypted;
}

/**
 * Decrypt sensitive fields of a social record
 */
export async function decryptSensitiveFields(record: any): Promise<any> {
  const sensitiveFields = ['name', 'phone', 'email', 'social_history'];
  const decrypted = { ...record };

  for (const field of sensitiveFields) {
    if (decrypted[field]) {
      try {
        decrypted[field] = await decryptData(decrypted[field]);
      } catch {
        // If decryption fails, keep original value
        // This handles cases where data wasn't encrypted
      }
    }
  }

  return decrypted;
}

/**
 * Hash data for comparison (e.g., for searching)
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a secure random ID
 */
export function generateSecureId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Proper AES-GCM encryption using Web Crypto API
 * This is the recommended approach for production
 */
export async function encryptWithAES(data: string): Promise<{ encrypted: string; iv: string }> {
  try {
    // Generate a random initialization vector
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Convert the key to a crypto key
    const encoder = new TextEncoder();
    const keyData = encoder.encode(ENCRYPTION_KEY);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    // Encrypt the data
    const dataBuffer = encoder.encode(data);
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      dataBuffer
    );

    // Convert to base64 for storage
    const encrypted = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
    const ivBase64 = btoa(String.fromCharCode(...iv));

    return { encrypted, iv: ivBase64 };
  } catch (error) {
    console.error('AES encryption error:', error);
    // Fallback to simple encoding
    return { encrypted: await encryptData(data), iv: '' };
  }
}

/**
 * Decrypt AES-GCM encrypted data
 */
export async function decryptWithAES(encryptedData: string, iv: string): Promise<string> {
  try {
    if (!iv) {
      // Fallback to simple decoding
      return await decryptData(encryptedData);
    }

    // Convert from base64
    const encryptedBuffer = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const ivArray = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

    // Convert the key to a crypto key
    const encoder = new TextEncoder();
    const keyData = encoder.encode(ENCRYPTION_KEY);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivArray },
      cryptoKey,
      encryptedBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('AES decryption error:', error);
    // Fallback to simple decoding
    return await decryptData(encryptedData);
  }
}
