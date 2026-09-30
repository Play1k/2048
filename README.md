# 2048 by play1k

A smooth, mobile-friendly 2048 game. Plain HTML, CSS and JavaScript — no build step, no dependencies.

## Features
- Animated tile sliding, spawning and merging
- Keyboard, touch swipe and mouse drag controls
- Score, best score and a top-10 leaderboard (saved in the browser via `localStorage`)
- Responsive layout for phones and desktops

## Run locally
Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

## Deploy on GitHub Pages
1. Create a new repository and push these files to the `main` branch.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
4. Your site will be live at `https://<your-username>.github.io/<repo-name>/` within a minute or two.

## Files
- `index.html` — page structure, including an "About this game" section
- `privacy.html` — privacy policy (fill in the date and contact email marked with `<!-- SET-... -->`)
- `ads.txt` — placeholder; replace with the real snippet Google gives you after approval
- `style.css` — styling and animations
- `script.js` — game logic, input handling, leaderboard

## Adding Google Analytics
Paste your tracking snippet into `index.html`'s `<head>`, right before `</head>`:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

Replace `G-XXXXXXXXXX` with your real Measurement ID in both places.

## Getting ready for Google AdSense
Google's own eligibility bar (support.google.com/adsense/answer/9724) is: your own original content, compliance with the [AdSense Program policies](https://support.google.com/adsense/answer/48182), and being 18 or over. There's no official minimum traffic or post count — but these help real-world approval odds:

- [x] **Own, original content** — the "About this game" section is written specifically for this game.
- [x] **Clear navigation** — a small nav links to the About section and privacy policy.
- [x] **Privacy policy** — required if you'll use Analytics or ads with EU visitors. Add your real contact email and date in `privacy.html` before going live.
- [ ] **Custom domain** — optional, but tends to approve more easily than a bare `github.io` subdomain.
- [ ] **Some real traffic and a bit of history** — not an official rule, but a site that's been live a little while tends to fare better with reviewers than one submitted the same day it's built.
- [ ] **Apply for AdSense** at [adsense.google.com](https://www.google.com/adsense/start/), add this site's URL, and after approval replace `ads.txt` with your real publisher line and add your ad unit code where you'd like ads to appear.

## License
MIT
