export async function fileToBase64(file: File): Promise<{ base64: string; extension: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] ?? '';
      const mimeExt = file.type.split('/')[1] ?? 'jpg';
      const extension = mimeExt === 'jpeg' ? 'jpg' : mimeExt;
      resolve({ base64, extension });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}