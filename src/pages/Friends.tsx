import { useEffect, useState } from 'react';
import { UserPlus, Trash2 } from 'lucide-react';

export default function Friends() {
  const [friends, setFriends] = useState<any[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { refresh(); }, []);

  async function refresh() {
    setFriends(await window.stud.getFriends());
    setFeed(await window.stud.getFriendsFeed());
  }

  async function addFriend() {
    const clean = name.trim();
    if (!clean) return;
    setBusy(true);
    setFriends(await window.stud.addFriend(clean));
    setName('');
    setBusy(false);
  }

  async function removeFriend(id: string) {
    setFriends(await window.stud.removeFriend(id));
    setFeed(await window.stud.getFriendsFeed());
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="title">Friends</div>
          <div className="subtitle">Track who you watch with and see reviews you've shared.</div>
        </div>
      </div>

      <div className="panel">
        <div className="eyebrow" style={{ marginBottom: 12 }}>Add a friend</div>
        <div className="row">
          <input
            className="search"
            placeholder="Friend's name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addFriend()}
          />
          <button className="primary" onClick={addFriend} disabled={busy || !name.trim()}>
            <UserPlus size={15} /> Add
          </button>
        </div>
        {friends.length > 0 && (
          <div className="row" style={{ marginTop: 16, flexWrap: 'wrap' }}>
            {friends.map((f) => (
              <span key={f.id} className="feature-list" style={{ display: 'inline-flex' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {f.name}
                  <button className="ghost icon-only" style={{ width: 22, height: 22 }} onClick={() => removeFriend(f.id)}>
                    <Trash2 size={12} />
                  </button>
                </span>
              </span>
            ))}
          </div>
        )}
        {friends.length === 0 && <p className="subtitle" style={{ marginTop: 12 }}>No friends added yet.</p>}
      </div>

      <div className="panel">
        <div className="eyebrow" style={{ marginBottom: 12 }}>Shared with friends</div>
        {feed.length === 0 && <p className="subtitle">Nothing shared yet. Share a review with friends from your Profile page.</p>}
        {feed.map((r) => (
          <div key={r.id} className="feed-item">
            <div className="split">
              <b>{r.title}</b>
              <span className="avg-pill">{typeof r.average === 'number' ? r.average.toFixed(1) : r.average} / 5</span>
            </div>
            <div className="tiny-muted">{r.service}</div>
            {r.text && <p style={{ marginTop: 8, marginBottom: 8 }}>{r.text}</p>}
            <div className="tiny-muted">Shared with: {(r.sharedWithNames || []).join(', ') || '—'}</div>
          </div>
        ))}
      </div>
    </>
  );
}
