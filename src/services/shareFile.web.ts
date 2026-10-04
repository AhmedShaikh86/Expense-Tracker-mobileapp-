/** Web version of shareFile.ts: downloads the file in the browser. */
export async function shareTextFile(fileName: string, content: string, mimeType: string): Promise<void> {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
