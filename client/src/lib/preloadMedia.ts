const preloaded = new Set<string>();

const isVideo = (url: string) => /\.(mp4|webm|mov|avi)$/i.test(url);

const preloadImage = (url: string) => {
  const img = new Image();
  img.src = url;
};

const preloadVideo = (url: string) => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = 'video';
  link.href = url;
  document.head.appendChild(link);
};

export function preloadMedia(urls: Array<string | undefined | null>) {
  urls
    .filter((u): u is string => Boolean(u))
    .forEach((url) => {
      if (preloaded.has(url)) return;
      preloaded.add(url);
      if (isVideo(url)) {
        preloadVideo(url);
      } else {
        preloadImage(url);
      }
    });
}
