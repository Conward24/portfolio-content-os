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
    uploadFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')));
  }

  async function deletePhoto(id) {
    try {
      await fetch('/api/photos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      setPhotos(prev => prev.filter(p => p.id !== id));
    } catch (e) { console.error(e); }
  }

  const filtered = filter === 'all' ? photos : photos.filter(p => p.brand === filter);

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
                <img
                  src={photo.url}
                  alt={photo.name}
                  style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                />
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className={`brand-badge badge-${photo.brand}`}>{BRANDS[photo.brand]?.short || photo.brand}</span>
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
