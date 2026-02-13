/**
 * Tests for Checkpoint Manager
 */
import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

const CheckpointManager = require('../../extraction/checkpoint-manager');

describe('CheckpointManager', () => {
  const testDir = path.join(__dirname, '.test-checkpoints');
  let mgr;

  beforeEach(() => {
    mgr = new CheckpointManager(testDir);
  });

  afterEach(async () => {
    await mgr.clearAll();
  });

  describe('save/load', () => {
    it('should save and load data', async () => {
      await mgr.save('EXT_1', 'table_T001', { rows: 100, status: 'done' });
      const data = await mgr.load('EXT_1', 'table_T001');
      expect(data).toEqual({ rows: 100, status: 'done' });
    });

    it('should return null for non-existent checkpoint', async () => {
      const data = await mgr.load('NOPE', 'missing');
      expect(data).toBeNull();
    });
  });

  describe('exists', () => {
    it('should return true for existing checkpoint', async () => {
      await mgr.save('EXT_1', 'key1', { data: 1 });
      expect(await mgr.exists('EXT_1', 'key1')).toBe(true);
    });

    it('should return false for missing checkpoint', async () => {
      expect(await mgr.exists('EXT_1', 'missing')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear checkpoints for an extractor', async () => {
      await mgr.save('EXT_1', 'key1', { data: 1 });
      await mgr.save('EXT_1', 'key2', { data: 2 });
      await mgr.clear('EXT_1');
      expect(await mgr.exists('EXT_1', 'key1')).toBe(false);
    });
  });

  describe('getProgress', () => {
    it('should report progress across extractors', async () => {
      await mgr.save('EXT_1', 'table_A', { done: true });
      await mgr.save('EXT_1', '_complete', { status: 'done' });
      await mgr.save('EXT_2', 'table_B', { done: true });

      const progress = await mgr.getProgress();
      expect(progress.EXT_1.complete).toBe(true);
      expect(progress.EXT_1.checkpointCount).toBe(2);
      expect(progress.EXT_2.complete).toBe(false);
    });
  });
});
