import Photo from './Photo.jsx';

/* ---------------------------------------------------------------------------
   PageHeader — the banner every interior page opens with.
   --------------------------------------------------------------------------- */
export default function PageHeader({
  eyebrow,
  title,
  titleAccent,
  lede,
  photo,
  alt,
  children,
}) {
  return (
    <header className="relative overflow-hidden bg-forest-900 pt-32 text-cream-100 sm:pt-36">
      {photo && (
        <div className="absolute inset-0">
          <Photo src={photo} alt={alt || ''} ratio="" className="h-full w-full opacity-45" imgClassName="" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-900 via-forest-900/80 to-forest-900/60" />
        </div>
      )}
      <div className="grain-overlay" />
      <div className="shell relative pb-14 sm:pb-16">
        <p className="eyebrow eyebrow--light">{eyebrow}</p>
        <h1 className="mt-6 max-w-3xl text-h2 font-display text-balance">
          {title}
          {titleAccent && <span className="italic text-clay-300"> {titleAccent}</span>}
        </h1>
        {lede && <p className="lede mt-5 max-w-2xl text-cream-100/75">{lede}</p>}
        {children}
      </div>
    </header>
  );
}
