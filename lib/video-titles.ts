/** A stable creator label, even when an installation has never registered. */
export function videoCreatorLabel(video: any) {
  return video?.account?.name || video?.account?.email || video?.account?.username ||
    video?.name || video?.email || video?.username || video?.systemName ||
    (video?.deviceId ? `${video?.platform || 'Device'} · ${video?.deviceId}` : 'Unknown creator');
}

export function topicPreview(item: any) {
  return String(item?.title || item?.preview || item?.topic || '').trim().slice(0, 280) || null;
}
