import fs from 'fs';
import path from 'path';

const convertedBase = path.join(process.cwd(), 'public/videos/converted');

fs.rmSync(convertedBase, { recursive: true, force: true });
fs.mkdirSync(convertedBase, { recursive: true });

console.log('public/videos/converted cleaned.');
