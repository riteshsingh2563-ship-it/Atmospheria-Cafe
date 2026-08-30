import { useMemo, useRef, useState } from 'react';
import { useLive } from '../../hooks/useLive.js';
import { subscribeGallery, addGalleryPhoto, updateGalleryPhoto, deleteGalleryPhoto, reorderGallery, initialGallery } from '../../lib/api.js';
import { uploadImage } from '../../lib/storageApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Panel, Modal, ConfirmDialog, Empty, Spinner, Toggle, Pill } from '../../components/admin/ui.jsx';
import Photo from '../../components/Photo.jsx';
import { GALLERY_ALBUMS } from '../../data/seed.js';
import { sourceHintFor } from '../../lib/placeholder.js';
import { Images, Upload, Trash, Pencil, Drag, ChevronLeft, ChevronRight, Star } from '../../components/Icons.jsx';

const albumName = (id) => GALLERY_ALBUMS.find((a) => a.id === id)?.name ?? id;

export default function GalleryManager() {
  const { rows, loading } = useLive(subscribeGallery, { initial: initialGallery() });
  const { push } = useToast();
  const fileRef = useRef(null);

  const [album, setAlbum] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  const [dragId, setDragId] = useState(null);

  const albums = useMemo(() => {
    const ids = new Set(rows.map((r) => r.album));
    const known = GALLERY_ALBUMS.filter((a) => ids.has(a.id));
    const extra = [...ids].filter((id) => !GALLERY_ALBUMS.some((a) => a.id === id)).map((id) => ({ id, name: id }));
    return [...known, ...extra];
  }, [rows]);

  const shown = useMemo(() => (album === 'all' ? rows : rows.filter((r) => r.album === album)), [rows, album]);

  const onPick = async (e) => {
    const files = [...(e.target.files || [])];
    if (!files.length) return;
    setUploading(true);
    let ok = 0;
    for (const file of files) {
      try {
        const { url, path } = await uploadImage(file, 'gallery', file.name.replace(/\.[a-z0-9]+$/i, ''));
        await addGalleryPhoto({
          album: album === 'all' ? 'ambience' : album,
          src: url,
          storagePath: path,
          alt: file.name.replace(/[-_.]+/g, ' ').replace(/\.[a-z0-9]+$/i, ''),
          caption: file.name.replace(/[-_.]+/g, ' ').replace(/\.[a-z0-9]+$/i, ''),
          source: 'Uploaded from the admin portal',
          featured: false,
          sortOrder: 1000 + ok * 10,
        });
        ok += 1;
      } catch (err) {
        push(`${file.name}: ${err.message || 'upload failed'}`, { tone: 'error' });
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
    if (ok) push(`${ok} photograph${ok === 1 ? '' : 's'} added to ${albumName(album === 'all' ? 'ambience' : album)}.`, { tone: 'success' });
  };

  const move = async (index, dir) => {
    const next = [...shown];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    await reorderGallery(next.map((r) => r.id));
  };

  const onDrop = async (targetId) => {
    if (!dragId || dragId === targetId) return setDragId(null);
    const ids = shown.map((r) => r.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    setDragId(null);
    await reorderGallery(ids);
  };

  return (
    <div className="space-y-6">
      <Panel
        title="Gallery manager"
        subtitle={`${rows.length} photographs · the public gallery grid reads this collection live`}
        actions={
          <>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={onPick} className="sr-only" id="gal-upload" />
            <label htmlFor="gal-upload" className="btn-primary btn-sm cursor-pointer">
              {uploading ? <Spinner /> : <Upload className="h-4 w-4" />} {uploading ? 'Uploading…' : 'Upload photos'}
            </label>
          </>
        }
        bodyClass="p-4"
      >
        <div className="flex flex-wrap items-center gap-2">
          <button data-active={album === 'all'} onClick={() => setAlbum('all')} className="chip px-3.5 py-2 text-[12.5px]">
            All albums
          </button>
          {albums.map((a) => (
            <button key={a.id} data-active={album === a.id} onClick={() => setAlbum(a.id)} className="chip px-3.5 py-2 text-[12.5px]">
              {a.name} ({rows.filter((r) => r.album === a.id).length})
            </button>
          ))}
          <p className="ml-auto text-[12px] text-ink-muted">
            {loading ? 'Loading…' : 'Drag a tile, or use the arrows, to reorder the public grid.'}
          </p>
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-ink-muted">
          Where the photographs come from: {sourceHintFor('/images/gallery/photo.jpg')}. Files uploaded here are
          downscaled to 1400px and pushed to Firebase Storage; the placeholder paths under{' '}
          <code className="rounded bg-bark-100 px-1">/public/images</code> are used until then.
        </p>
      </Panel>

      {shown.length === 0 && !loading ? (
        <Panel>
          <Empty
            icon={Images}
            title="No photographs in this album yet"
            hint="Upload from the venue phone, or drop files into /public/images/gallery and point a record at them."
          />
        </Panel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((p, i) => (
            <article
              key={p.id}
              draggable
              onDragStart={() => setDragId(p.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(p.id)}
              className={`card group overflow-hidden transition ${dragId === p.id ? 'opacity-40' : ''}`}
            >
              <div className="relative">
                <Photo src={p.src} alt={p.alt} ratio="4/3" className="" showMissingBadge />
                <span className="absolute left-2 top-2 cursor-grab rounded-full bg-forest-950/70 p-1.5 text-cream-100" title="Drag to reorder">
                  <Drag className="h-3.5 w-3.5" />
                </span>
                {p.featured && (
                  <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-gold/90 text-forest-900" title="Featured — spans two cells in the public grid">
                    <Star className="h-3 w-3" />
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <Pill tone="forest">{albumName(p.album)}</Pill>
                  <span className="ml-auto text-[11px] text-ink-muted">#{i + 1}</span>
                </div>
                <p className="mt-2 line-clamp-2 font-display text-[15px] leading-snug text-forest-800">{p.caption}</p>
                <p className="mt-1 line-clamp-1 font-mono text-[10.5px] text-ink-muted">{String(p.src).slice(0, 60)}</p>

                <div className="mt-3 flex items-center gap-1.5 border-t border-bark-200 pt-3">
                  <button onClick={() => move(i, -1)} className="btn-outline btn-sm px-2.5" aria-label="Move earlier" disabled={i === 0}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => move(i, 1)} className="btn-outline btn-sm px-2.5" aria-label="Move later" disabled={i === shown.length - 1}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setEditing(p)} className="btn-outline btn-sm ml-auto" aria-label={`Edit ${p.caption}`}>
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setConfirmingDelete(p)} className="btn-outline btn-sm text-clay-700" aria-label={`Delete ${p.caption}`}>
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <PhotoForm
          photo={editing}
          albums={albums}
          onClose={() => setEditing(null)}
          onSaved={async (patch) => {
            await updateGalleryPhoto(editing.id, patch);
            setEditing(null);
            push('Photograph updated.', { tone: 'success' });
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(confirmingDelete)}
        title="Remove this photograph?"
        message="It disappears from the public gallery immediately. The file itself stays in Firebase Storage unless you delete it there."
        onConfirm={async () => {
          await deleteGalleryPhoto(confirmingDelete.id);
          push('Photograph removed.', { tone: 'success' });
        }}
        onClose={() => setConfirmingDelete(null)}
      />
    </div>
  );
}

function PhotoForm({ photo, albums, onClose, onSaved }) {
  const [form, setForm] = useState({ ...photo });
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const { push } = useToast();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e }));

  const replacePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const { url, path } = await uploadImage(file, 'gallery', file.name.replace(/\.[a-z0-9]+$/i, ''));
      setForm((f) => ({ ...f, src: url, storagePath: path }));
    } catch (err) {
      push(err.message || 'Upload failed.', { tone: 'error' });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Modal
      wide
      title="Edit photograph"
      subtitle={String(photo.src).slice(0, 80)}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="btn-outline btn-sm">
            Cancel
          </button>
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onSaved(form);
              } finally {
                setBusy(false);
              }
            }}
            className="btn-primary btn-sm"
          >
            {busy ? <Spinner /> : null} Save
          </button>
        </>
      }
    >
      <div className="grid gap-6 sm:grid-cols-[12rem_1fr]">
        <div>
          <Photo src={form.src} alt={form.alt} ratio="4/3" className="rounded-xl" showMissingBadge />
          <input ref={fileRef} type="file" accept="image/*" onChange={replacePhoto} className="sr-only" id="gal-replace" />
          <label htmlFor="gal-replace" className="btn-outline btn-sm mt-2.5 w-full cursor-pointer justify-center">
            <Upload className="h-3.5 w-3.5" /> Replace file
          </label>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="gp-caption">Caption</label>
            <input id="gp-caption" className="field" value={form.caption || ''} onChange={set('caption')} />
          </div>
          <div>
            <label className="label" htmlFor="gp-alt">Alt text (accessibility &amp; SEO)</label>
            <textarea id="gp-alt" rows={2} className="field resize-none" value={form.alt || ''} onChange={set('alt')} />
            <p className="mt-1.5 text-[11px] text-ink-muted">Describe the scene, not the mood: “deck seating at night with fairy lights”.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="gp-album">Album</label>
              <select id="gp-album" className="field" value={form.album} onChange={set('album')}>
                {albums.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="gp-src">Path or URL</label>
              <input id="gp-src" className="field font-mono text-[12px]" value={form.src} onChange={set('src')} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="gp-source">Where it came from</label>
            <input id="gp-source" className="field" value={form.source || ''} onChange={set('source')} placeholder="Instagram @atmospheria.raipur — grid post" />
          </div>
          <label className="flex items-center gap-3 text-[13.5px] text-ink">
            <Toggle checked={Boolean(form.featured)} onChange={(v) => setForm((f) => ({ ...f, featured: v }))} label="Featured" />
            Featured — spans two cells in the public grid
          </label>
        </div>
      </div>
    </Modal>
  );
}
