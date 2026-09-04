import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { RawFile } from "seyfert";

export function getRawFile(
  relativePath: string | null,
  fallbackPath: string,
  base: string
): {attach: RawFile[]; fileName: string | null} {
  let tg: string | null = null;

  if (relativePath) {
    const resPath = resolve(process.cwd(), relativePath);
    if (existsSync(resPath)) {
      tg = resPath;
    }
  }

  if (!tg && existsSync(fallbackPath)) {
    tg = fallbackPath;
  }

  if (!tg) return {attach: [], fileName: null};

  const ext = extname(tg);
  const final = `${base}${ext}`;

  return {
    attach: [
      {
        filename: final,
        data: readFileSync(tg),
      },
    ],
    fileName: final,
  };
}
