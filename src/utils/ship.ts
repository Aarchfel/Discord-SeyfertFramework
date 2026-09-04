import path from "node:path";
import fs from 'node:fs';
import { MediaGalleryItem, RawFile } from "seyfert";

export function calculateShip(ui1ID: string, u2ID: string) {
  const today = new Date().toISOString().split('T')[0];

  const sort = [ui1ID, u2ID].sort().join('_')

  const seed = `${sort}${today}_Shipr`;

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0
  }

  const percent = Math.abs(hash) % 101;

  return {percent}
}

export function  getShipMedia(perc: number) {
  let selFile = 'furriesad1.png';

  if (perc >= 70) {
    const gayfur = ['furrie1.jpeg', 'furrie3.jpeg'];
    const rand = Math.floor(Math.random() * gayfur.length);
    selFile = gayfur[rand];
  } else if (perc >= 20) {
    const gayfur = ['furrie2.jpeg', 'furrie4.jpeg'];
    const rand = Math.floor(Math.random() * gayfur.length);
    selFile = gayfur[rand];
  } else {
    selFile = 'furrisad1.jpeg'
  }

  const img = path.join(process.cwd(), 'assets', 'images', selFile)

  const medGal = new MediaGalleryItem().setMedia(`attachment://${selFile}`)

  const attach: RawFile = {
    filename: selFile,
    data: fs.readFileSync(img)
  }

  return {medGal, attach}
}