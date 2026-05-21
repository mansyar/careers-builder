/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Shared mock functions
const mockExistsSync = vi.fn();
const mockReadFileSync = vi.fn();
const mockWriteFileSync = vi.fn();

// Mock fs completely - never touch real filesystem in tests
vi.mock('node:fs', () => ({
  default: {
    existsSync: mockExistsSync,
    readFileSync: mockReadFileSync,
    writeFileSync: mockWriteFileSync,
  },
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
}));

const TEST_SECRET_PATH = '/tmp/test-secret';
const TEST_SECRET = Buffer.alloc(64, 0x42); // 64 bytes of 0x42

const { encrypt, decrypt } = await import('./encryption');

describe('encryption module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('encrypt', () => {
    beforeEach(() => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(TEST_SECRET);
    });

    it('returns { encrypted, iv, tag } for a given plaintext', () => {
      const result = encrypt('test-api-key', TEST_SECRET_PATH);
      expect(result).toHaveProperty('encrypted');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('tag');
      expect(typeof result.encrypted).toBe('string');
      expect(typeof result.iv).toBe('string');
      expect(typeof result.tag).toBe('string');
      expect(result.encrypted.length).toBeGreaterThan(0);
      expect(result.iv.length).toBeGreaterThan(0);
      expect(result.tag.length).toBeGreaterThan(0);
    });

    it('produces different ciphertext for same plaintext (random IV)', () => {
      const result1 = encrypt('same-key', TEST_SECRET_PATH);
      const result2 = encrypt('same-key', TEST_SECRET_PATH);
      expect(result1.iv).not.toBe(result2.iv);
      expect(result1.encrypted).not.toBe(result2.encrypted);
    });
  });

  describe('encrypt/decrypt round-trip', () => {
    beforeEach(() => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(TEST_SECRET);
    });

    it('decrypt with correct values returns original plaintext', () => {
      const original = 'sk-test-api-key-12345';
      const { encrypted, iv, tag } = encrypt(original, TEST_SECRET_PATH);
      const decrypted = decrypt(encrypted, iv, tag, TEST_SECRET_PATH);
      expect(decrypted).toBe(original);
    });

    it('decrypt with wrong tag throws (GCM auth tag verification)', () => {
      const original = 'sk-test-key';
      const { encrypted, iv } = encrypt(original, TEST_SECRET_PATH);
      const wrongTag = '00'.repeat(16);
      expect(() => {
        decrypt(encrypted, iv, wrongTag, TEST_SECRET_PATH);
      }).toThrow();
    });

    it('decrypt with wrong IV throws (GCM auth tag catches tampered IV)', () => {
      const original = 'sk-test-key';
      const { encrypted, tag } = encrypt(original, TEST_SECRET_PATH);
      const wrongIv = 'ff'.repeat(12);
      expect(() => {
        decrypt(encrypted, wrongIv, tag, TEST_SECRET_PATH);
      }).toThrow();
    });
  });

  describe('error handling', () => {
    it('auto-creates secret file when missing (first run)', () => {
      mockExistsSync.mockReturnValue(false);
      // Should not throw - generates a new secret
      const result = encrypt('test', TEST_SECRET_PATH);
      expect(result).toHaveProperty('encrypted');
      expect(mockWriteFileSync).toHaveBeenCalledWith(TEST_SECRET_PATH, expect.any(Buffer));
    });

    it('throws descriptive error when secret file cannot be read', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });
      expect(() => {
        encrypt('test', TEST_SECRET_PATH);
      }).toThrow(/secret/i);
    });
  });
});
