'use client';

import { useEffect, useRef, useState } from 'react';

export default function VideoDeckModal({ item, onClose }) {
  const [manifest, setManifest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const audioRef = useRef(null);

  useEffect(() => {
    let active = true;
    async function fetchManifest() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/media/item/${encodeURIComponent(item.id)}/manifest`);
        if (!res.ok) throw new Error(`Could not load media (status ${res.status}).`);
        const data = await res.json();
        if (active) {
          setManifest(data);
          // If meta has beats, start on beat 0
          if (data.meta?.beats?.length) {
            const firstSheet = data.meta.beats[0]?.sheet ?? 0;
            setCurrentSlide(firstSheet);
          }
        }
      } catch (err: any) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchManifest();
    return () => {
      active = false;
    };
  }, [item.id]);

  const beats = manifest?.meta?.beats || [];
  const images = manifest?.images || [];
  const voiceFiles = manifest?.voice || [];

  const currentBeatData = beats[currentBeat] || null;
  const currentImage = images[currentSlide] || images[0] || null;

  // Find voice file for current beat
  const currentVoiceFile = (() => {
    if (beats.length) {
      const match = voiceFiles.find(v => v.includes(`voice-${currentBeat}.mp3`));
      if (match) return match;
    }
    return voiceFiles[currentBeat] || voiceFiles[0] || null;
  })();

  // Synchronize audio playback
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying && currentVoiceFile) {
      audioRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentVoiceFile, currentBeat]);

  function handleBeatEnded() {
    if (currentBeat + 1 < beats.length) {
      const nextB = currentBeat + 1;
      setCurrentBeat(nextB);
      if (beats[nextB]?.sheet !== undefined && beats[nextB].sheet < images.length) {
        setCurrentSlide(beats[nextB].sheet);
      }
    } else {
      setIsPlaying(false);
    }
  }

  function togglePlay() {
    setIsPlaying(p => !p);
  }

  function goToBeat(index) {
    if (index < 0 || index >= beats.length) return;
    setCurrentBeat(index);
    if (beats[index]?.sheet !== undefined && beats[index].sheet < images.length) {
      setCurrentSlide(beats[index].sheet);
    }
  }

  function goToSlide(index) {
    if (index < 0 || index >= images.length) return;
    setCurrentSlide(index);
    // Find first beat of this slide
    const firstBeatIndex = beats.findIndex(b => b.sheet === index);
    if (firstBeatIndex !== -1) {
      setCurrentBeat(firstBeatIndex);
    }
  }

  return (
    <div className="lightbox-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="lightbox-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 960,
          width: '92vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--line)',
          boxShadow: 'var(--shadow)',
          padding: 0,
          overflow: 'hidden'
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface-2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <span className="pill ok" style={{ fontSize: 11 }}>
              📹 Video Player
            </span>
            <span
              style={{
                fontWeight: 650,
                fontSize: 14,
                color: 'var(--text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {item.title || item.preview || item.id}
            </span>
            <span className="mono cell-faint" style={{ fontSize: 11 }}>
              {item.id}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn small ghost"
              onClick={() => setShowJson(j => !j)}
              title="View metadata and script"
            >
              {showJson ? 'View Player' : '{ } Storyboard'}
            </button>
            <button
              className="lightbox-close"
              onClick={onClose}
              style={{ position: 'static', transform: 'none' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {loading && (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <span className="spinner" />
              <div className="cell-faint" style={{ marginTop: 12 }}>
                Loading explanation video package...
              </div>
            </div>
          )}

          {error && (
            <div style={{ padding: 30, color: 'var(--bad)', textAlign: 'center' }}>
              <p>Failed to load video: {error}</p>
              <button className="btn small" onClick={() => window.location.reload()}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && manifest && (
            <div>
              {showJson ? (
                <div>
                  <h4 style={{ margin: '0 0 8px' }}>meta.json Storyboard</h4>
                  <pre
                    style={{
                      background: 'var(--bg)',
                      padding: 14,
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 12,
                      overflowX: 'auto',
                      maxHeight: '60vh'
                    }}
                  >
                    {JSON.stringify(manifest.meta, null, 2)}
                  </pre>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Slide Stage */}
                  <div
                    style={{
                      position: 'relative',
                      background: '#000',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 380,
                      maxHeight: '52vh'
                    }}
                  >
                    {currentImage ? (
                      <img
                        src={`/api/media/item/${encodeURIComponent(item.id)}/${currentImage}`}
                        alt="Slide"
                        style={{
                          width: '100%',
                          height: '100%',
                          maxHeight: '52vh',
                          objectFit: 'contain',
                          display: 'block'
                        }}
                      />
                    ) : (
                      <div className="cell-faint">No image available for this slide.</div>
                    )}

                    {/* Slide badges overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        display: 'flex',
                        gap: 6
                      }}
                    >
                      <span
                        className="pill"
                        style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', color: '#fff' }}
                      >
                        Slide {currentSlide + 1} of {Math.max(images.length, 1)}
                      </span>
                      {beats.length > 0 && (
                        <span
                          className="pill"
                          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', color: '#fff' }}
                        >
                          Beat {currentBeat + 1} of {beats.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Narration Caption Box */}
                  <div
                    style={{
                      background: 'var(--surface-2)',
                      borderLeft: '4px solid var(--accent)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10.5,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--accent)',
                        fontWeight: 700
                      }}
                    >
                      {currentBeatData?.label ? `Beat ${currentBeat + 1}: ${currentBeatData.label}` : 'Narration'}
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text)' }}>
                      {currentBeatData?.say || currentBeatData?.show || manifest.meta?.script || 'Listening to explanation...'}
                    </div>
                  </div>

                  {/* Audio Element */}
                  {currentVoiceFile && (
                    <audio
                      ref={audioRef}
                      src={`/api/media/item/${encodeURIComponent(item.id)}/${currentVoiceFile}`}
                      onEnded={handleBeatEnded}
                      preload="auto"
                    />
                  )}

                  {/* Player Controls */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 10,
                      background: 'var(--surface-2)',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        className="btn small"
                        onClick={togglePlay}
                        style={{ minWidth: 80, fontWeight: 650 }}
                      >
                        {isPlaying ? '⏸ Pause' : '▶ Play'}
                      </button>

                      <button
                        className="btn small ghost"
                        onClick={() => goToBeat(currentBeat - 1)}
                        disabled={currentBeat === 0}
                      >
                        ⏮ Prev
                      </button>

                      <button
                        className="btn small ghost"
                        onClick={() => goToBeat(currentBeat + 1)}
                        disabled={currentBeat >= beats.length - 1}
                      >
                        Next ⏭
                      </button>
                    </div>

                    {/* Slide selector pills */}
                    {images.length > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="cell-faint" style={{ fontSize: 11 }}>
                          Slides:
                        </span>
                        {images.map((img, idx) => (
                          <button
                            key={img}
                            className={`btn small ${currentSlide === idx ? '' : 'ghost'}`}
                            style={{ padding: '2px 8px', fontSize: 11 }}
                            onClick={() => goToSlide(idx)}
                          >
                            {idx + 1}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Files list / download links */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <a
                        className="btn small ghost"
                        href={`/api/media/item/${encodeURIComponent(item.id)}/meta.json`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ textDecoration: 'none', fontSize: 11 }}
                      >
                        ⬇ meta.json
                      </a>
                      {currentImage && (
                        <a
                          className="btn small ghost"
                          href={`/api/media/item/${encodeURIComponent(item.id)}/${currentImage}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ textDecoration: 'none', fontSize: 11 }}
                        >
                          ⬇ Full Image
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
