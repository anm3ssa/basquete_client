/** Tipos de imagem aceitos para foto de perfil */
export const TIPOS_DE_FOTO = ['image/jpeg', 'image/png', 'image/webp'];

/** Tamanho máximo do arquivo original (antes de reduzir) */
export const TAMANHO_MAXIMO_FOTO = 5 * 1024 * 1024;

/**
 * Recorta a imagem no centro (quadrado) e reduz para no máximo `lado` px, em JPEG.
 * Uma foto de celular de vários MB vira algo em torno de 50–80 KB.
 */
export async function prepararFotoDePerfil(arquivo: File, lado = 512): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo);
  const recorte = Math.min(bitmap.width, bitmap.height);
  const destino = Math.min(lado, recorte);

  const canvas = document.createElement('canvas');
  canvas.width = destino;
  canvas.height = destino;
  const contexto = canvas.getContext('2d');
  if (!contexto) throw new Error('Canvas indisponível');

  contexto.drawImage(
    bitmap,
    (bitmap.width - recorte) / 2,
    (bitmap.height - recorte) / 2,
    recorte,
    recorte,
    0,
    0,
    destino,
    destino,
  );
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar a imagem'))), 'image/jpeg', 0.85),
  );
}
