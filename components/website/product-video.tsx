import { PRODUCT_VIDEOS } from "@/lib/product-videos";

export default function ProductVideo({
  video = "overview",
}: { video?: keyof typeof PRODUCT_VIDEOS }) {
  const item = PRODUCT_VIDEOS[video];

  return (
    <div className="relative isolate my-8 aspect-video min-h-[200px] w-full overflow-hidden rounded-xl bg-black ring-1 ring-black/10 dark:ring-white/15 sm:rounded-2xl">
      <iframe
        className="absolute inset-0 block h-full w-full border-0"
        src={`https://www.youtube-nocookie.com/embed/${item.id}?playsinline=1&rel=0`}
        title={item.title}
        loading="lazy"
        allow="encrypted-media; picture-in-picture; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
