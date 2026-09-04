export interface AdviceSlipResp {
  slip: {
    id: number;
    advice: string;
  }
}

export async function getAdviceQ(): Promise<string | null> {
  try {
    const resp = await fetch('https://api.adviceslip.com/advice?t=' + Math.random());

    if (!resp.ok) {
      throw new Error(`HTTP ERR! Status: ${resp.status}`);
    }

    const dat = (await resp.json()) as AdviceSlipResp;

    return dat.slip.advice;
  } catch (err) {
    console.error('Failed to fetch advice:', err);
    return null;
  }
}