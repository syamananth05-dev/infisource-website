# InfiSource Global - Website

A complete multi-page static website (no server needed - host it anywhere:
Netlify, Vercel, GitHub Pages, cPanel, Hostinger, etc.).

## Pages

| File | What it is |
|---|---|
| `index.html` | Home - hero, category tiles, why-choose-us, vendor CTA |
| `about.html` | About - company, industries served, commitments |
| `services.html` | All 18 sourcing categories with the interactive explorer (deep links like `services.html#cat-mep-solutions`) |
| `contact.html` | Contact details + inquiry form |
| `vendor.html` | **Vendor registration** - GST, MSME, business type, categories, payment terms, catalogue upload, autosave draft, ~10 minutes |

## Folder structure

```
infisource-website/
├── index.html
├── about.html
├── services.html
├── contact.html
├── vendor.html
├── google-apps-script.gs   <- backend code for the forms (see below)
├── SETUP.md                <- this file
└── assets/
    ├── css/style.css       <- the whole design system
    ├── js/config.js        <- FORM_ENDPOINT lives here
    ├── js/shared.js        <- animations, menu, marquees
    ├── js/data.js          <- the 18 categories data
    ├── js/explorer.js      <- category explorer (services page)
    ├── js/forms.js         <- vendor + inquiry form logic, GST validation
    └── img/                <- logo + favicon
```

## Connecting the forms to your Google Sheet (5 minutes)

Right now, until you connect the sheet, both forms fall back to opening an
email pre-filled with everything the visitor typed. To make submissions
land directly in a Google Sheet instead:

1. Open your Google Sheet (create one named e.g. *InfiSource Vendors*).
2. In the Sheet: **Extensions -> Apps Script**.
3. Delete whatever is in the editor and paste the entire contents of
   `google-apps-script.gs` (included in this folder).
4. Click **Deploy -> New deployment** -> select type **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, authorize, then **copy the Web app URL**.
6. Open `assets/js/config.js` and paste it in:
   ```js
   var CONFIG = {
     FORM_ENDPOINT: "https://script.google.com/macros/s/XXXX/exec"
   };
   ```
7. Upload the site. Done.

**What you get in the sheet:**
- Tab **Vendors**: one row per vendor with every field - company, GSTIN,
  MSME, categories served, payment terms, contact, etc.
- Tab **Inquiries**: one row per website inquiry.
- Uploaded files (catalogue, GST/MSME/dealership certificates) are saved to
  a Google Drive folder *InfiSource Website Uploads -> <Company name>*,
  with viewable links added to the vendor's row.

No server, no database, no monthly cost - Google runs it for free.

## Editing content

- **Categories** (product lists, brands, icons): edit the `CATS` array in
  `assets/js/data.js`.
- **Vendor form questions**: edit the form HTML in `vendor.html`. New fields
  with a `name` attribute flow to the sheet automatically (new columns are
  appended on first submission).
- **Contact details**: search for `sales@infisourceglobal.in` and the phone
  placeholders in `contact.html` and update.
- **Colors / fonts**: edit the CSS variables at the top of
  `assets/css/style.css`.

## Notes

- All phone/address fields currently show "(to be confirmed)" placeholders -
  replace them in `contact.html` when final details are available.
- The vendor form validates GST number format + checksum, phone, email and
  PIN code on the client side before anything is sent.
- Vendor drafts autosave in the visitor's browser (localStorage) so an
  interrupted registration can be resumed.
