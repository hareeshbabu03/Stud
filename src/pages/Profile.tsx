import { useEffect, useState } from 'react';
import { Trash2, Share2 } from 'lucide-react';

export default function Profile({ profile }: { profile: any; onProfile: (p: any) => void }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [sharingId, setSharingId] = useState<string | null>(null);

  useEffect(() => {
    window.stud.getReviews().then(setReviews);
    window.stud.getFriends().then(setFriends);
  }, []);

  async function removeReview(id: string) {
    setReviews(await window.stud.removeReview(id));
  }

  async function toggleShare(review: any, friendId: string) {
    const current: string[] = review.sharedWith || [];
    const next = current.includes(friendId) ? current.filter((id) => id !== friendId) : [...current, friendId];
    const updated = await window.stud.shareReview(review.id, next);
    setReviews(updated);
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="title">Profile</div>
          <div className="subtitle">Your account and full review history.</div>
        </div>
      </div>

      <div className="panel">
        <div className="profile-header">
          {profile?.avatar ? <img src={profile.avatar} alt="" /> : <div className="avatar-fallback" style={{ width: 72, height: 72, fontSize: 28 }}>{profile?.name?.[0] || 'S'}</div>}
          <div>
            <h2>{profile?.name || 'Local User'}</h2>
            <div className="subtitle">{profile?.email || 'Signed in locally'}</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="eyebrow" style={{ marginBottom: 14 }}>Your reviews ({reviews.length})</div>
        {reviews.length === 0 && <p className="subtitle">No reviews logged yet.</p>}
        {reviews.map((r) => (
          <div key={r.id} className="feed-item">
            <div className="split">
              <b>{r.title}</b>
              <span className="avg-pill">{typeof r.average === 'number' ? r.average.toFixed(1) : r.average} / 5</span>
            </div>
            <div className="tiny-muted">{r.service} · {new Date(r.createdAt).toLocaleDateString()}</div>
            {r.categories && (
              <div className="row" style={{ marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
                {Object.entries(r.categories as Record<string, number>).map(([cat, score]) => (
                  <span key={cat} className="tiny-muted" style={{ background: 'var(--panel2)', borderRadius: 999, padding: '4px 10px' }}>
                    {cat}: {score}/5
                  </span>
                ))}
              </div>
            )}
            {r.text && <p style={{ marginTop: 8 }}>{r.text}</p>}

            <div className="row" style={{ marginTop: 10 }}>
              <button className="ghost" onClick={() => setSharingId(sharingId === r.id ? null : r.id)}>
                <Share2 size={14} /> {r.sharedWith?.length ? `Shared with ${r.sharedWith.length}` : 'Share'}
              </button>
              <button className="ghost" onClick={() => removeReview(r.id)}><Trash2 size={14} /></button>
            </div>

            {sharingId === r.id && (
              <div className="row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
                {friends.length === 0 && <span className="tiny-muted">Add friends first, from the Friends page.</span>}
                {friends.map((f) => {
                  const active = (r.sharedWith || []).includes(f.id);
                  return (
                    <button key={f.id} className={active ? 'primary' : 'ghost'} style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => toggleShare(r, f.id)}>
                      {f.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
