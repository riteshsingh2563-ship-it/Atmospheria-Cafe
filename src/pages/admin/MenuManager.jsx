import { useMemo, useRef, useState } from 'react';
import { useLive } from '../../hooks/useLive.js';
import { subscribeMenu, saveMenuItem, deleteMenuItem, initialMenu } from '../../lib/api.js';
import { uploadImage } from '../../lib/storageApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Panel, Modal, ConfirmDialog, Empty, Toggle, Pill, Spinner } from '../../components/admin/ui.jsx';
import Photo from '../../components/Photo.jsx';
import { allCategories } from '../../sections/MenuSection.jsx';
import { CATEGORIES, DEFAULT_ADDONS, SPICE_LEVELS, inr } from '../../lib/venue.js';
import { sourceHintFor } from '../../lib/placeholder.js';
import { Search, Plus, Pencil, Trash, Upload, BookOpen, VegDot } from '../../components/Icons.jsx';

const TAG_OPTIONS = [
  { id: 'bestseller', label: 'Bestseller' },
  { id: 'chef', label: "Chef's special" },
  { id: 'premium', label: 'Premium' },
];

const blank = {
  id: '',
  name: '',
  category: 'starters',
  price: 280,
  veg: true,
  spice: 'Medium',
  serves: 'Serves 2',
  description: '',
  photo: '',
  tags: [],
  addons: [],
  available: true,
  sortOrder: 100,
};

export default function MenuManager() {
  const { rows, loading } = useLive(subscribeMenu, { initial: initialMenu() });
  const { push } = useToast();
  const categories = useMemo(() => allCategories(rows), [rows]);

  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [onlyOut, setOnlyOut] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(null);

  const filtered = useMemo(
    () =>
      rows
        .filter((m) => {
          if (cat !== 'all' && m.category !== cat) return false;
          if (onlyOut && m.available !== false) return false;
          if (q && !`${m.name} ${m.description}`.toLowerCase().includes(q.toLowerCase())) return false;
          return true;
        })
        .sort((a, b) => (a.category === b.category ? (a.sortOrder ?? 9e9) - (b.sortOrder ?? 9e9) : String(a.category).localeCompare(String(b.category)))),
    [rows, q, cat, onlyOut],
  );

  const toggleAvailable = async (item) => {
    try {
      await saveMenuItem({ ...item, available: item.available === false });
      push(`${item.name} is now ${item.available === false ? 'back on' : "86'd"}.`, { tone: 'success' });
    } catch (err) {
      push(err.message || 'Could not update availability.', { tone: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <Panel
        title="Menu manager"
        subtitle={`${rows.length} dishes across ${categories.length} sections · writes go to the menu_items collection`}
        actions={
          <>
            <button data-active={onlyOut} onClick={() => setOnlyOut((v) => !v)} className="chip px-3.5 py-2 text-[12.5px]">
              86&apos;d only
            </button>
            <button onClick={() => setEditing({ ...blank })} className="btn-primary btn-sm">
              <Plus className="h-4 w-4" /> Add dish
            </button>
          </>
        }
        bodyClass="p-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[12rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dishes" className="field py-2 pl-9 text-[13px]" />
          </div>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="field w-auto py-2 text-[13px]" aria-label="Filter by section">
            <option value="all">All sections</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="text-[12.5px] text-ink-muted">{loading ? 'Loading…' : `${filtered.length} shown`}</p>
        </div>
      </Panel>

      {filtered.length === 0 && !loading ? (
        <Panel>
          <Empty
            icon={BookOpen}
            title={rows.length ? 'No dish matches that filter' : 'The menu is empty'}
            hint={
              rows.length
                ? 'Clear the search or the section filter.'
                : 'Add your first dish, or load the starter content from the dashboard.'
            }
            action={
              <button onClick={() => setEditing({ ...blank })} className="btn-primary btn-sm">
                <Plus className="h-4 w-4" /> Add dish
              </button>
            }
          />
        </Panel>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-bark-200 bg-cream-50 shadow-card">
          <table className="w-full min-w-[46rem] text-left">
            <thead className="border-b border-bark-200 bg-cream-100 text-[11px] uppercase tracking-[0.12em] text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Dish</th>
                <th className="px-4 py-3 font-semibold">Section</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">On the menu</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bark-200">
              {filtered.map((m) => (
                <tr key={m.id} className={m.available === false ? 'bg-bark-100/40' : ''}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Photo
                        src={m.photo}
                        alt={`${m.name} — ${m.description}`}
                        ratio="1/1"
                        className="h-12 w-12 shrink-0 rounded-lg"
                        showMissingBadge
                      />
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-display text-[16px] text-forest-800">
                          <VegDot veg={m.veg} />
                          {m.name}
                        </p>
                        <p className="line-clamp-1 text-[12px] text-ink-muted">{m.description}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(m.tags || []).map((t) => (
                            <Pill key={t} tone={t === 'bestseller' ? 'clay' : t === 'premium' ? 'gold' : 'forest'}>
                              {TAG_OPTIONS.find((o) => o.id === t)?.label ?? t}
                            </Pill>
                          ))}
                          {m.available === false && <Pill tone="slate">86&apos;d</Pill>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-ink-soft">
                    {categories.find((c) => c.id === m.category)?.name ?? m.category}
                  </td>
                  <td className="px-4 py-3 font-display text-[16px] text-clay-700">{inr(m.price)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Toggle checked={m.available !== false} onChange={() => toggleAvailable(m)} label={`Availability of ${m.name}`} />
                      <span className="text-[12px] text-ink-muted">{m.available === false ? 'Hidden' : 'Live'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => setEditing({ ...m })} className="btn-outline btn-sm" aria-label={`Edit ${m.name}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmingDelete(m)}
                        className="btn-outline btn-sm text-clay-700"
                        aria-label={`Delete ${m.name}`}
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <ItemForm
          item={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setEditing(null);
            push(`${saved.name} saved.`, { tone: 'success' });
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(confirmingDelete)}
        title="Delete this dish?"
        message={
          confirmingDelete
            ? `${confirmingDelete.name} will be removed from menu_items and disappear from the public menu immediately. Use the availability switch instead if it is only off for tonight.`
            : ''
        }
        onConfirm={async () => {
          await deleteMenuItem(confirmingDelete.id);
          push('Dish deleted.', { tone: 'success' });
        }}
        onClose={() => setConfirmingDelete(null)}
      />
    </div>
  );
}

/* ==========================================================================
   ItemForm — add / edit a dish, including the photo upload
   ========================================================================== */
function ItemForm({ item, categories, onClose, onSaved }) {
  const { push } = useToast();
  const [form, setForm] = useState({ ...blank, ...item });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e }));

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadImage(file, 'menu', form.name || 'dish');
      setForm((f) => ({ ...f, photo: url }));
      push('Photo uploaded and compressed.', { tone: 'success' });
    } catch (err) {
      push(err.message || 'Upload failed.', { tone: 'error' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const save = async () => {
    if (form.name.trim().length < 2) {
      push('The dish needs a name.', { tone: 'error' });
      return;
    }
    if (!Number(form.price) && Number(form.price) !== 0) {
      push('Enter a price.', { tone: 'error' });
      return;
    }
    setBusy(true);
    try {
      const category = String(form.category).trim().toLowerCase().replace(/\s+/g, '-');
      const saved = await saveMenuItem({
        ...form,
        name: form.name.trim(),
        category,
        price: Number(form.price),
        sortOrder: Number(form.sortOrder) || 100,
        photo: form.photo || `/images/menu/${category}-${form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}.jpg`,
        photoSource: form.photoSource || `Instagram @atmospheria.raipur / Google Maps listing (${category})`,
      });
      onSaved(saved);
    } catch (err) {
      push(err.message || 'Could not save the dish.', { tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const toggleTag = (id) =>
    setForm((f) => ({ ...f, tags: f.tags?.includes(id) ? f.tags.filter((t) => t !== id) : [...(f.tags || []), id] }));
  const toggleAddon = (id) =>
    setForm((f) => ({ ...f, addons: f.addons?.includes(id) ? f.addons.filter((t) => t !== id) : [...(f.addons || []), id] }));

  return (
    <Modal
      wide
      title={item.id ? `Edit — ${item.name}` : 'Add a dish'}
      subtitle={item.id ? `menu_items/${item.id}` : 'A new document in the menu_items collection'}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="btn-outline btn-sm">
            Cancel
          </button>
          <button onClick={save} disabled={busy} className="btn-primary btn-sm">
            {busy ? <Spinner /> : null} {item.id ? 'Save changes' : 'Add to menu'}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-[9rem_1fr]">
          {/* photo */}
          <div>
            <Photo src={form.photo} alt={`${form.name || 'New dish'} photograph`} ratio="1/1" className="rounded-xl" showMissingBadge />
            <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} className="sr-only" id="item-photo" />
            <label
              htmlFor="item-photo"
              className="btn-outline btn-sm mt-2.5 w-full cursor-pointer justify-center"
            >
              {uploading ? <Spinner /> : <Upload className="h-3.5 w-3.5" />} {uploading ? 'Uploading…' : 'Upload photo'}
            </label>
            <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
              {sourceHintFor(form.photo || '/images/menu/dish.jpg')}
            </p>
          </div>

          {/* basics */}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="it-name">Dish name</label>
                <input id="it-name" className="field" value={form.name} onChange={set('name')} placeholder="e.g. Paneer Tikka Lasooni" />
              </div>
              <div>
                <label className="label" htmlFor="it-cat">Section</label>
                <input
                  id="it-cat"
                  className="field"
                  list="category-list"
                  value={form.category}
                  onChange={set('category')}
                  placeholder="starters"
                />
                <datalist id="category-list">
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} />
                  ))}
                </datalist>
                <p className="mt-1.5 text-[11px] text-ink-muted">
                  Type a new id (e.g. <code className="rounded bg-bark-100 px-1">biryani</code>) and it appears on the public menu automatically.
                </p>
              </div>
              <div>
                <label className="label" htmlFor="it-price">Price (₹)</label>
                <input id="it-price" type="number" min={0} className="field" value={form.price} onChange={set('price')} />
              </div>
              <div>
                <label className="label" htmlFor="it-serves">Portion note</label>
                <input id="it-serves" className="field" value={form.serves} onChange={set('serves')} placeholder="Serves 2" />
              </div>
              <div>
                <label className="label" htmlFor="it-spice">Default spice</label>
                <select id="it-spice" className="field" value={form.spice} onChange={set('spice')}>
                  {SPICE_LEVELS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <label className="flex items-center gap-2.5 text-[13.5px] text-ink">
                <input type="checkbox" checked={form.veg} onChange={set('veg')} className="h-4 w-4 accent-forest-700" />
                <VegDot veg={form.veg} /> Vegetarian
              </label>
              <label className="flex items-center gap-2.5 text-[13.5px] text-ink">
                <Toggle checked={form.available !== false} onChange={(v) => setForm((f) => ({ ...f, available: v }))} label="Available" />
                Available (86&apos;d items are greyed out on the site)
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="it-desc">Description</label>
          <textarea id="it-desc" rows={2} className="field resize-none" value={form.description} onChange={set('description')} placeholder="One honest sentence about how it is made." />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="label">Menu tags</p>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((t) => (
                <button key={t.id} type="button" data-active={form.tags?.includes(t.id)} onClick={() => toggleTag(t.id)} className="chip">
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="label">Add-ons offered with this dish</p>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_ADDONS.map((a) => (
                <button key={a.id} type="button" data-active={form.addons?.includes(a.id)} onClick={() => toggleAddon(a.id)} className="chip">
                  {a.name} · {inr(a.price)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="it-order">Sort order</label>
            <input id="it-order" type="number" className="field" value={form.sortOrder} onChange={set('sortOrder')} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="it-photo-path">Photo path or URL</label>
            <input id="it-photo-path" className="field font-mono text-[12px]" value={form.photo} onChange={set('photo')} placeholder="/images/menu/dish-name.jpg" />
            <p className="mt-1.5 text-[11px] text-ink-muted">
              Drop the file at that path in <code className="rounded bg-bark-100 px-1">/public</code> and it renders without an upload.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
