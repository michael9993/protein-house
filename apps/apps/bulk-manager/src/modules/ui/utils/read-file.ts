/**
 * Read a file as text (CSV) or base64 (Excel).
 * Shared across all entity pages to avoid duplication.
 */
export async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    if (file.name.endsWith(".csv")) {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    } else {
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        resolve(btoa(binary));
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    }
  });
}
