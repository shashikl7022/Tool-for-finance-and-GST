# 💼 Finance & GST Tools

> A modern, responsive personal finance, productivity, and GST calculation suite. Built with semantic HTML5, modern CSS3 (dynamic custom properties, glassmorphism, responsive grid), and pure vanilla JavaScript. Zero external dependencies, runs offline, and is **100% free to host forever on GitHub Pages**.

![Finance & GST Tools Preview](https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1200&q=80)

---

## 🌟 Key Features

- **⏱️ Focus & Pomodoro Timer**:
  - Customizable work (default 25m) and break intervals.
  - Animated SVG circular countdown ring.
  - Synthesized audio bell and chimes via the **Web Audio API** (zero external MP3 files needed).
  - Focus session tracker and stats.

- **✅ Task & Habit Priority Checklist**:
  - Add, complete, and filter tasks (All / Active / Completed).
  - Priority badges (`Urgent 🔥`, `High`, `Normal`).
  - Auto-persists to browser `localStorage`.

- **📝 Live Scratchpad & Drafts**:
  - Instant live word count, character count, and estimated reading time.
  - One-click copy-to-clipboard and `.md` file export.
  - Real-time debounced auto-saving.

- **🛠️ Mini Utilities Suite**:
  - **Instant QR Code Generator**: Renders scannable QR codes natively to HTML5 `<canvas>` for any link or text, with instant PNG download.
  - **Harmonic Color Palette Generator**: Creates 5-color palettes with 1-click HEX code copying.
  - **Quick Ratio & Percentage Calculator**: Instant real-time percentage, share, and delta calculations.

- **🎨 Multi-Theme System**:
  - 🌙 Deep Dark (Default)
  - ☀️ Clean Light
  - 👾 Cyberpunk Neon
  - 🌲 Emerald Forest

- **⌨️ Keyboard Shortcuts**:
  - `Space` — Start / Pause timer
  - `R` — Reset timer
  - `Alt + N` — Quick-focus on new task input
  - `Esc` — Close modals

---

## 🚀 How to Run Locally in 5 Seconds

Because FocusFlow is built with vanilla web standards and zero build tools:

1. Navigate to the project folder:
   ```bash
   cd C:\Users\ksach\.gemini\antigravity\scratch\focusflow-app
   ```
2. Double-click **`index.html`** to open it directly in Google Chrome, Microsoft Edge, Firefox, or Safari!
3. (Optional) Or run a local lightweight web server:
   ```bash
   npx serve .
   # or with Python:
   python -m http.server 3000
   ```
   Then open `http://localhost:3000` in your browser.

---

## 🌐 How to Publish for FREE on GitHub Pages (Step-by-Step)

GitHub Pages provides **100% free hosting forever** with an SSL certificate (`https://`) and high-speed global CDN.

### Method A: Using Git Command Line (Recommended)

1. **Create a new repository on GitHub**:
   - Go to [github.com/new](https://github.com/new).
   - Name your repository (for example: `focusflow` or `my-website`).
   - Leave it **Public**.
   - Do NOT check "Initialize with README".
   - Click **Create repository**.

2. **Initialize git and push your code**:
   Open PowerShell or Terminal in this folder (`C:\Users\ksach\.gemini\antigravity\scratch\focusflow-app`) and run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of FocusFlow Hub"
   git branch -M main
   git remote add origin https://github.com/<YOUR-GITHUB-USERNAME>/<YOUR-REPO-NAME>.git
   git push -u origin main
   ```
   *(Replace `<YOUR-GITHUB-USERNAME>` and `<YOUR-REPO-NAME>` with your GitHub username and repository name).*

3. **Enable GitHub Pages**:
   - In your GitHub repository, click on **Settings** (top navigation tab).
   - In the left sidebar, click on **Pages**.
   - Under **Build and deployment**:
     - **Source**: Select `Deploy from a branch`.
     - **Branch**: Select `main` and folder `/ (root)`.
   - Click **Save**.

4. **Your Website is Live!**
   - Refresh the Pages settings page after 30–60 seconds.
   - You will see a banner:
     > *"Your site is live at `https://<YOUR-GITHUB-USERNAME>.github.io/<YOUR-REPO-NAME>/`"*
   - Click the link to view your free live website!

---

### Method B: Uploading Directly in the Browser (No Git Required)

1. Go to [github.com/new](https://github.com/new).
2. Name your repository (e.g. `focusflow`) and set it to **Public**.
3. Under the empty repository screen, click the link: **"uploading an existing file"**.
4. Drag and drop all the files from this folder (`index.html`, `styles.css`, `app.js`, `README.md`).
5. Click **Commit changes**.
6. Go to **Settings** &rarr; **Pages** &rarr; select **Branch: main** &rarr; **Save**.
7. Done! Your website is live.

---

## ⚡ Alternative 100% Free Hosting Options

If you prefer other platforms, FocusFlow works out of the box with:

- **Netlify Drop**:
  - Visit [app.netlify.com/drop](https://app.netlify.com/drop).
  - Drag and drop the `focusflow-app` folder onto the web page.
  - Your site gets a free live URL (e.g. `https://random-name.netlify.app`) in under 10 seconds.
- **Vercel**:
  - Import your GitHub repo on [vercel.com](https://vercel.com) for zero-config instant deployment.
- **Cloudflare Pages**:
  - Connect your GitHub repo on [pages.cloudflare.com](https://pages.cloudflare.com) for ultra-fast CDN edge hosting.

---

## 🛠️ Customization

- **Change App Title / Branding**: Edit line 20 of `index.html`.
- **Change Default Timer Durations**: Edit lines 28–30 in `app.js`.
- **Customize Themes**: Add or modify theme variables in `styles.css` under `:root` and `[data-theme="..."]`.

---

## 📄 License
MIT License. Free to use, modify, and distribute!
