import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Saves text to a temporary file and opens the share sheet.
 * (The web version in shareFile.web.ts downloads the file instead.)
 */
export async function shareTextFile(fileName: string, content: string, mimeType: string): Promise<void> {
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(content);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType,
    dialogTitle: 'Export expenses',
    UTI: 'public.comma-separated-values-text',
  });
}
