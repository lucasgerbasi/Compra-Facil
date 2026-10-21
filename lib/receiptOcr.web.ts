import { createWorker } from 'tesseract.js';

/** Browser OCR for receipt photos. Portuguese language data is downloaded on first use and cached by the browser. */
export async function recognizeReceipt(uri: string): Promise<string> {
  let worker: Awaited<ReturnType<typeof createWorker>> | undefined;
  try {
    worker = await createWorker('por');
    const result = await worker.recognize(uri);
    const text = result.data.text?.trim() ?? '';
    if (!text) {
      throw new Error('O OCR não conseguiu ler texto nesta imagem. Tente uma foto mais próxima, reta e bem iluminada.');
    }
    return text;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('O OCR')) throw error;
    throw new Error('Não consegui processar a imagem no navegador. Confira sua conexão com a internet e tente novamente. Na primeira tentativa, o OCR precisa baixar os dados do idioma português.');
  } finally {
    if (worker) await worker.terminate();
  }
}
