import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { BRANDS } from '../lib/constants';

export default function Library() {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadBrand, setUploadBrand] = useState('mylua');
  const [filter, setFilter] = useState('all');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  useEffect(() => { loadPhotos(); }, []);

  async function loadPhotos() {
    try {
      const res = await fetch('/api/photos');
      const data = await res.json();
      setPhotos(data.photos || []);
    } catch (e) { console.error(e); }
  }

  async function uploadFiles(files) {
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const form = new FormData();
      form.append('file', file);
      form.append('brand', uploadBrand);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: form });
        const data = await res.json();
        if (data.photo) setPhotos(prev => [data.photo, ...prev]);
      } catch (e) { console.error(e); }
    }
    setUploading(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/')));
  }

  async function deletePhoto(id) {
    try {
      await fetch('/api/photos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      setPhotos(prev => prev.filter(p => p.id !== id));
    } catch (e) { console.error(e); }
  }

  const [q, setQ] = useState('');
  const filtered = (filter === 'all' ? photos : photos.filter(p => p.brand === filter))
    .filter(p => !q.trim() || (p.name || '').toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <Layout title="Photo library" active="library">
      <div className="page-header">
        <span className="page-title">Photo library</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={uploadBrand} onChange={e => setUploadBrand(e.target.value)} style={{ width: 'auto', fontSize: 12 }}>
            {Object.values(BRANDS).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading...' : '+ Upload photos'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
            onChange={e => uploadFiles(Array.from(e.target.files))} />
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: 1100 }}>
        {/* Filter */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {['all', 'mylua', 'henway', 'blabbing', 'mike'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '5px 12px', borderRadius: 7, fontSize: 12, cursor: 'pointer',
              border: filter === f ? '1.5px solid var(--text)' : '0.5px solid var(--border2)',
              background: filter === f ? 'var(--bg3)' : 'var(--bg)',
              color: 'var(--text2)', fontFamily: 'inherit', fontWeight: filter === f ? 600 : 400,
            }}>
              {f === 'all' ? 'All brands' : BRANDS[f]?.name || f}
            </button>
          ))}
          {/* 177 files and no way to find one. */}
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search by name"
            style={{
              marginLeft: 'auto', fontSize: 12, fontFamily: 'inherit', padding: '5px 10px',
              borderRadius: 7, border: '0.5px solid var(--border2)',
              background: 'var(--bg)', color: 'var(--text)', minWidth: 170,
            }}
          />
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `1.5px dashed ${dragOver ? 'var(--text)' : 'var(--border2)'}`,
            borderRadius: 12, padding: '32px 20px',
            textAlign: 'center', cursor: 'pointer', marginBottom: 24,
            background: dragOver ? 'var(--bg3)' : 'var(--bg)',
            transition: 'all 0.15s',
          }}
        >
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>
            Drag and drop photos here, or click to browse
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
            Uploading as: <strong style={{ color: 'var(--text2)' }}>{BRANDS[uploadBrand]?.name}</strong>
          </div>
        </div>

        {/* Photo grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
            No photos yet for this brand. Upload some above.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 12
          }}>
            {filtered.map(photo => (
              <div key={photo.id} style={{
                background: 'var(--bg)', border: '0.5px solid var(--border2)',
                borderRadius: 10, overflow: 'hidden', position: 'relative',
              }}>
                {/* An <img> cannot render an mp4, so every video in here was a
                    broken box. Videos get a real player with their poster frame;
                    images keep the square crop. */}
                {/\.(mp4|mov|webm)$/i.test(photo.name) ? (
                  <video
                    src={photo.url}
                    preload="metadata"
                    muted
                    playsInline
                    controls
                    style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block', background: '#000' }}
                  />
                ) : (
                  <img
                    src={photo.url}
                    alt={photo.name}
                    style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                  />
                )}
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className={`brand-badge badge-${photo.brand}`}>{BRANDS[photo.brand]?.short || photo.brand}</span>
                    {/* The point of a library is taking things out of it. Without
                        this the only way to a file was waiting for it to appear on
                        a post in today's queue. */}
                    <a
                      href={photo.url}
                      download={photo.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Download ${photo.name}`}
                      style={{
                        fontSize: 11, fontWeight: 700, textDecoration: 'none',
                        color: 'var(--text)', border: '0.5px solid var(--border2)',
                        borderRadius: 5, padding: '2px 7px', marginLeft: 'auto', marginRight: 6,
                      }}
                    >↓ Save</a>
                    <button
                      onClick={() => deletePhoto(photo.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 12, color: 'var(--text3)', fontFamily: 'inherit'
                      }}
                    >×</button>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {photo.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
