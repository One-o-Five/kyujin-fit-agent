import { describe, expect, it } from 'vitest';
import { loadPrompt } from './prompts';

describe('loadPrompt', () => {
  it('prompts/<name>/<version>.md を読み込む', async () => {
    const prompt = await loadPrompt('extract-job-post', 'v1');

    expect(prompt).toContain('<job_post>');
  });

  it('不正な名前やバージョンは拒否する', async () => {
    await expect(loadPrompt('../secret', 'v1')).rejects.toThrow();
    await expect(loadPrompt('extract-job-post', 'latest')).rejects.toThrow();
  });
});
