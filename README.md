# 🔐 SwiftPass — Password Generator

> A Chrome extension to generate strong passwords and auto-fill them into any login form instantly. 100% private — no data stored, no servers, no tracking.

---

## ✨ Features

- 🔑 **Instant Password Generation** — Creates strong, random passwords with one click
- ✏️ **Auto-Fill** — Fills the generated password directly into any password field on any website
- 🎛️ **Customizable Options** — Adjust length (8–32 chars) and character sets (uppercase, lowercase, numbers, symbols)
- 📊 **Strength Indicator** — Real-time visual feedback on password strength
- 📋 **One-Click Copy** — Copy any password to clipboard instantly
- 🕓 **Password History** — View and reuse recently generated passwords
- 🔒 **100% Private** — Everything runs locally in your browser. No servers, no accounts, no tracking

---

## 📸 Preview

> *(Add a screenshot of the extension popup here)*

---

## 🚀 Installation

### From Source (Developer Mode)

1. Clone or download this repository
   ```bash
   git clone https://github.com/ashokkuikel/swiftpass.git
   ```

2. Open Chrome and go to `chrome://extensions/`

3. Enable **Developer mode** (toggle in the top right)

4. Click **Load unpacked** and select the `password-extension` folder

5. SwiftPass will appear in your Chrome toolbar — click the icon to get started!

---

## 🛠️ Usage

1. Click the **SwiftPass** icon in your Chrome toolbar
2. A strong password is automatically generated on open
3. Adjust the **length** and **character options** as needed
4. Click **Fill Password on Page** to auto-fill the active password field
5. Or click **Copy Password** to copy it to your clipboard

---

## 📁 Project Structure

```
password-extension/
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── manifest.json       # Extension config (Manifest V3)
├── popup.html          # Extension UI
├── popup.css           # Styles
└── popup.js            # Core logic
```

---

## 🔒 Privacy

SwiftPass is built with privacy as a core principle:

- ✅ All password generation happens **locally in your browser**
- ✅ **No data is ever sent** to any external server
- ✅ No analytics, no telemetry, no tracking
- ✅ No account or login required
- ✅ Open source — inspect every line of code yourself

---

## 🧰 Tech Stack

- Vanilla JavaScript (no frameworks)
- Chrome Extensions API — Manifest V3
- `chrome.storage` for local history only
- `chrome.scripting` for auto-fill

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

> ⭐ If you find SwiftPass useful, consider giving it a star on GitHub!
