/** Duração do vídeo original via &lt;video&gt; (antes da compressão). */
export function probeVideoDuration(src: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const cleanup = () => {
      video.removeAttribute("src");
      video.load();
      video.remove();
    };
    video.onloadedmetadata = () => {
      const d = video.duration;
      cleanup();
      if (Number.isFinite(d) && d > 0) resolve(d);
      else reject(new Error("Não foi possível ler a duração do vídeo."));
    };
    video.onerror = () => {
      cleanup();
      reject(new Error("Erro ao carregar metadados do vídeo."));
    };
    video.src = src;
  });
}
