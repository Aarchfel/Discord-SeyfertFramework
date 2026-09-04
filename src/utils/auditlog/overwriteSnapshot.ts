interface RawOverwrite {
  id: string;
  type: number;
  allow: bigint;
  deny: bigint;
}

const store = new Map<string, Map<string, RawOverwrite>>();

export function getOverwriteSnapshot(
  cId: string,
): Map<string, RawOverwrite> | null {
  return store.get(cId) ?? null;
}

export function setOverwriteSnapshot(
  cId: string,
  ovw: Map<string, RawOverwrite>,
) {
  store.set(cId, new Map(ovw));
}
