import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/** リポジトリ直下の prompts/ ディレクトリ */
const PROMPTS_DIR = fileURLToPath(new URL('../../../../prompts/', import.meta.url));

/**
 * prompts/<name>/<version>.md を読み込む。
 * プロンプトはコードから分離し、バージョンごとにファイルを分けて管理する（prompts/README.md）。
 */
export async function loadPrompt(name: string, version: string): Promise<string> {
  if (!/^[a-z0-9-]+$/.test(name) || !/^v[0-9]+$/.test(version)) {
    throw new Error(`プロンプトの指定が正しくありません: ${name}/${version}`);
  }
  const text = await readFile(`${PROMPTS_DIR}${name}/${version}.md`, 'utf8');
  return text.trim();
}
