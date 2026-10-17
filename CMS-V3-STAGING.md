# NT3105 public CMS V3 — preview-only
Branch: `feature/admin-v3-cms-preview`. **Do not merge until Admin V3 and SQL migration have been verified.**
Admin PR branch: https://github.com/nt3105/nt3105-admin/tree/feature/admin-v3-cms-preview

## Behavior
- `cms-public-v3.js` uses **publishable** Supabase key only, reads `nt3105_cms_published` (never drafts), and updates the existing page.
- Updates hero, avatar image, section texts, gallery, skills, projects, contact links, social links, theme, layout, SEO, footer and original music player.
- Guestbook uses existing `site_comments` RLS policies.
- If migration missing, network unavailable or no published document exists, **leaves current website unchanged**.
- No Admin credentials or admin controls appear on the public website.

## QA before approval
1. Admin: save a draft and confirm the published website does not change.
2. Publish deliberately and reload website in an incognito browser; verify updates.
3. Add multiple images and tracks. Verify gallery swipe and next/previous track in existing player.
4. Test disabled effects with `prefers-reduced-motion`; verify navbar, game and all old scripts work.
5. Submit a test review and hide it from Admin; it must disappear for guests.
6. Verify no render errors in console and no console warnings on authorized responses.
7. On phone, compare at width 375px and laptop width 1280px.

The current GitHub Pages publication source is `main`; do not change Pages settings or DNS for preview.
