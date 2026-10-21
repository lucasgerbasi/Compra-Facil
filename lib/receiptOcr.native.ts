export async function recognizeReceipt(uri: string): Promise<string> {
  // Load the native module only when OCR is requested, so the existing app
  // can still launch in Expo Go; OCR itself needs a custom development build.
  const extractor = await import('expo-text-extractor');
  const blocks = await extractor.extractTextFromImage(uri);
  return blocks.join('\n');
}
