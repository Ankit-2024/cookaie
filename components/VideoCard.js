export default function VideoCard({ video }) {
  return (
    <div className="flex flex-col gap-3 group">
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <iframe
          src={`https://www.youtube.com/embed/${video.videoId}`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full border-0"
        ></iframe>
      </div>
      <div className="px-1">
        <h3 className="font-medium text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-snug" dangerouslySetInnerHTML={{ __html: video.title }}>
        </h3>
        <p className="text-sm text-neutral-500 mt-1">{video.channelTitle}</p>
      </div>
    </div>
  );
}
