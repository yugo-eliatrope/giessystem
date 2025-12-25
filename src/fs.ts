import { Dirent } from 'fs';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const allFilesInDir = async (dirPath: string): Promise<string[]> => {
  const dirents = await readdir(dirPath, { withFileTypes: true });
  const dirs: Dirent[] = [];
  const files: string[] = [];
  dirents.forEach((item) => {
    if (item.isFile()) files.push(join(dirPath, item.name));
    else dirs.push(item);
  });
  const nextDirsFiles = await Promise.all(dirs.map((item) => allFilesInDir(join(dirPath, item.name))));
  return files.concat(nextDirsFiles.flat());
};

export const readAllFilesInDir = async (dirPath: string): Promise<Record<string, Buffer>> => {
  const files = await allFilesInDir(dirPath);
  const contents = await Promise.all(files.map((file) => readFile(file)));
  return Object.fromEntries(files.map((file, index) => [file, contents[index]]));
};
