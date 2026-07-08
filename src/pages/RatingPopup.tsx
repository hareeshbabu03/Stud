import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';

const CATEGORIES = [
  { key: 'story', label: 'Story' },
  { key: 'acting', label: 'Acting' },
  { key: 'direction', label: 'Direction' },
  { key: 'visuals', label: 'Visuals' },
  { key: 'music', label: 'Music' }
];

export default function RatingPopup({ title, service }: { title: string; service: string }) {
  const [movieTitle, setMovieTitle] = useState(title);
  const [scores, setScores] = useState<Record<string, number>>({ story: 0, acting: 0, direction: 0, visuals: 0, music: 0 });
  const [text, setText] = useState('');
  const [friends, setFriends] = useState<any[]>([]);
  const [sharedWith, setSharedWith] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { window.stud.getFriends().then(setFriends); }, []);

  const average = useMemo(() => {
    const rated = Object.values(scores).filter((v) => v > 0);
    if (!rated.length) return 0;
    return Math.round((rated.reduce((a, b) => a + b, 0) / rated.length) * 10) / 10;
  }, [scores]);

  const canSave = movieTitle.trim().length > 0 && Object.values(scores).some((v) => v > 0);

  function setScore(cat: string, value: number) {
    setScores((prev) => ({ ...prev, [cat]: value }));
  }

  function toggleFriend(id: string) {
    setSharedWith((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }

  async function save() {
    setSaving(true);
    await window.stud.addReview({
      title: movieTitle.trim(),
      service,
      categories: scores,
      average,
      text: text.trim(),
      sharedWith
    });
    setSaving(false);
    window.stud.windowClose();
  }

  function discard() {
    window.stud.windowClose();
  }

  return (
    <div className="rating-panel">
      <div className="rating-header">
        <span className="eyebrow">Log this movie</span>
        <button className="ghost icon-only" onClick={discard}><X size={16} /></button>
      </div>

      <label className="field-label block">Movie title</label>
      <input
        className="title-input"
        value={movieTitle}
        onChange={(e) => setMovieTitle(e.target.value)}
        placeholder="Movie title"
      />
      <div className="tiny-muted">Detected via {service}. Edit the title above if Stud got it wrong.</div>

      <div className="category-section">
        <div className="category-heading split">
          <h3>Rate by category</h3>
          <span className="avg-pill">{average > 0 ? average.toFixed(1) : '—'} / 5</span>
        </div>
        {CATEGORIES.map((cat) => (
          <div key={cat.key} className="category-row">
            <span>{cat.label}</span>
            <span className="category-stars">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`star ${scores[cat.key] >= n ? 'filled' : ''}`}
                  onClick={() => setScore(cat.key, n)}
                  aria-label={`${cat.label} ${n} stars`}
                >★</button>
              ))}
            </span>
          </div>
        ))}
      </div>

      <label className="field-label block" style={{ marginTop: 18 }}>Review (optional)</label>
      <textarea
        className="review-box"
        placeholder="What did you think?"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {friends.length > 0 && (
        <>
          <label className="field-label block">Share with friends (optional)</label>
          <div className="row" style={{ flexWrap: 'wrap', marginTop: 4 }}>
            {friends.map((f) => (
              <button
                key={f.id}
                type="button"
                className={sharedWith.includes(f.id) ? 'primary' : 'ghost'}
                style={{ padding: '6px 10px', fontSize: 12 }}
                onClick={() => toggleFriend(f.id)}
              >
                {f.name}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="footer-actions">
        <button className="ghost" onClick={discard}>Discard</button>
        <button className="primary" onClick={save} disabled={!canSave || saving}>{saving ? 'Saving...' : 'Save review'}</button>
      </div>
    </div>
  );
}
