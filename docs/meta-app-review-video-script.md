# MetaSuite App Review — Video Script (word-for-word)

**Target length:** ~4 minutes
**Resolution:** 1080p (1920×1080), 60fps if possible
**Language:** English (UI + narration). Spanish subtitles optional, English subtitles recommended.
**Narration:** Calm, slow pace. Leave 1 second of silence before and after each section so the reviewer can jump by timestamp.

Before you start recording:
- Log out of MetaSuite (localStorage.clear() on the app origin).
- Clear browser cache.
- Close all tabs except MetaSuite.
- Hide bookmarks toolbar.
- Set browser zoom to 100%.
- Enable a visible mouse cursor / click highlighter (e.g. OBS "Mouse click highlight").
- Have the Meta OAuth account ready in another tab but logged in — so that Facebook Login does not ask for a password in the recording. (If it asks, that's fine too; just type slowly.)

---

## 00:00 – 00:20 · Intro + pre-login

**[Screen]** Start recording. Open a new tab. Type: `https://metasuite.dtgrowthpartners.com`. Press Enter. The login screen appears.

**[What to SAY on screen / narration]**:

> "Hi. This is MetaSuite, a Meta Ads campaign management dashboard by DT Growth Partners. This video walks through every permission our app requests. I will show the Meta login flow first, and then demonstrate each permission in context. The user interface is set to English."

**[Mouse action]** Move cursor to the flag button in the top-right of the login screen. Click to switch the UI to English if it is not already.

> "MetaSuite supports both Spanish and English. For this review I've switched the interface to English."

---

## 00:20 – 00:55 · Facebook Login + OAuth consent

**[Screen]** The login screen shows a big "Continue with Facebook" button.

**[Narration]**

> "Authentication uses Meta's standard OAuth 2.0 flow. I'll click 'Continue with Facebook'."

**[Mouse action]** Click the "Continue with Facebook" button. The Meta OAuth popup opens.

**[Narration while the popup loads]**

> "Meta's consent dialog now lists every permission our app requests. Please note: ads_management, ads_read, pages_show_list, business_management, pages_read_engagement, instagram_basic and whatsapp_business_management."

**[Mouse action]** Slowly scroll through the permissions list in the OAuth dialog so each line is visible for about a second.

**[Narration]**

> "I'll continue as the logged-in user."

**[Mouse action]** Click "Continue as …". Popup closes. The app redirects back to MetaSuite. The header shows the loading spinner and then the counts.

---

## 00:55 – 01:25 · business_management — ad accounts across Business Managers

**[Screen]** Focus on the top nav. There is a badge that reads, for example, "**30 accounts · 12 Business Managers**".

**[Narration]**

> "MetaSuite uses the business_management permission to enumerate every Business Manager the user belongs to and list every ad account in each one. Here you can see: thirty accounts across twelve Business Managers. Without business_management, the user would have to configure each Business Manager manually."

**[Mouse action]** Hover the "30 accounts · 12 Business Managers" badge — the tooltip explains it is loaded via business_management.

**[Mouse action]** Click on the ad account dropdown in the campaign builder (or open the Campaigns view if not already). The dropdown lists accounts grouped by Business Manager.

**[Narration]**

> "Accounts are grouped by Business Manager so the operator knows exactly where each one lives. I'll select one account."

**[Mouse action]** Select an ad account (e.g. "DTGP-CTG" from "DT Growth Partners"). The dropdown closes. Related fields (Page list, Instagram list) start loading.

---

## 01:25 – 01:55 · pages_show_list — Facebook Page dropdown

**[Screen]** Scroll to the "Identity" section of the campaign builder.

**[Narration]**

> "Because every ad needs to be published from a Facebook Page, MetaSuite uses the pages_show_list permission to fetch the list of Pages the user can publish from inside the selected ad account. You can see the explanatory hint under the dropdown."

**[Mouse action]** Click the "Facebook Page" dropdown. The list of Pages appears.

**[Narration while the list is visible]**

> "These are the Pages loaded via pages_show_list. I'll pick one."

**[Mouse action]** Select a Page (e.g. "DT Growth Partners"). The dropdown closes. The hint underneath now says: "Select the Facebook Page from your connected Business Managers that will publish this ad."

---

## 01:55 – 02:20 · instagram_basic — Instagram Account dropdown

**[Screen]** Stay in the "Identity" section. Move focus to the "Instagram Account" dropdown just below the Page dropdown.

**[Narration]**

> "For ads that run on Instagram, MetaSuite uses the instagram_basic permission to identify which Instagram Business account is linked to the selected Facebook Page. The dropdown below shows the linked Instagram profile."

**[Mouse action]** Click the "Instagram Account" dropdown. The linked Instagram professional account is listed as "@dtgrowthpartners" (or equivalent).

**[Narration]**

> "This is the Instagram account that will be attached to the ad creative. Without instagram_basic, the ad cannot appear on Instagram surfaces."

**[Mouse action]** Select the Instagram account. Dropdown closes.

---

## 02:20 – 03:15 · ads_management — full campaign creation (PAUSED)

**[Narration]**

> "Now the core of the app: ads_management. I'll create a complete campaign end-to-end. Every campaign created through MetaSuite is set to PAUSED, so no ad spend is generated."

**[Mouse action]** Scroll up to the template picker or click "New Campaign". Select a template, e.g. "Website Traffic".

**[Narration]**

> "I'm picking the Website Traffic template. Each template comes with objective, optimization goal, billing event and budget pre-configured."

**[Mouse action]** Scroll down to the media upload area. Upload an image from the computer or pick one from the Media Library.

**[Narration]**

> "I upload a single image for this ad. The app also integrates with the ad account's media library via the /adimages endpoint."

**[Mouse action]** Wait for AI generation to complete. The app fills 5 headlines, 5 descriptions, and 5 CTAs.

**[Narration]**

> "MetaSuite uses Anthropic's Claude AI to generate five headlines, five descriptions, and five calls to action. No Meta user data is sent to Claude — only the creative brief."

**[Mouse action]** Scroll down to the audience / budget section. Pick a default saved audience (or leave defaults). Budget is pre-filled.

**[Narration]**

> "I'll keep the default audience and daily budget of twenty thousand pesos, but remember — since the campaign is PAUSED, nothing will actually spend."

**[Mouse action]** Click the big "Create Campaign" button. The progress log starts appearing:
- Campaign creation SUCCESS: …
- AdSet creation SUCCESS: …
- Creative SUCCESS: …
- Ad creation SUCCESS: …

**[Narration]**

> "The app is now calling the Marketing API in sequence — Campaign, AdSet, Creative, Ad. All four objects are created with status PAUSED. Here is the success confirmation."

**[Mouse action]** OPTIONAL: Open a new tab with Meta Ads Manager, navigate to the ad account, and show the new campaign in PAUSED status. Take 5 seconds and close.

> "Here is the newly created campaign in Meta Ads Manager, confirmed as PAUSED. No ad spend has been incurred."

---

## 03:15 – 03:50 · ads_read — reports hub and per-account dashboard

**[Mouse action]** Close the Ads Manager tab. Back in MetaSuite, click the "Reportes" link in the nav.

**[Narration]**

> "MetaSuite uses the ads_read permission to build cross-account dashboards. The reports hub you see now aggregates spend, results, reach, and impressions across every ad account the user can access."

**[Mouse action]** Point out the KPI tiles at the top: "urgent accounts", "in review", "healthy", "inactive". Point out the portfolio totals row: "total spend today", "results today".

**[Narration]**

> "At the top we surface a health classification: urgent accounts are the ones that spent money today without producing any results. Below you can see portfolio totals with day-over-day deltas."

**[Mouse action]** Click on any account card or row (for example "DTGP-CTG"). The per-account report opens at /act_781485172384812.

**[Narration]**

> "Clicking an account opens its detailed report. We have three tabs: Yesterday, Today, and Last Month. Each tab shows spend, impressions, reach, and per-campaign breakdown with the main result type for each campaign — messages, leads, purchases, visits, or clicks."

**[Mouse action]** Click the Yesterday tab, then the Today tab, then the Last Month tab. Let each tab render for ~3 seconds.

---

## 03:50 – 04:10 · pages_read_engagement — page-level metrics

**[Screen]** Stay on the Last Month tab of the per-account report.

**[Narration]**

> "Finally, pages_read_engagement gives us access to Page-level engagement metrics — reach, impressions, and page-driven results — which we display alongside the ad insights so the operator can tie paid performance back to the Page that published the ad."

**[Mouse action]** Point out the "Reach", "Impressions" fields and any "conversations / results" counters at the top of the report. Hover each for ~1 second.

**[Mouse action]** OPTIONAL: Click "Download PDF" in the footer to show the full monthly PDF export opening in a new tab. Let it load, then close.

**[Narration]**

> "The same data is included in the downloadable PDF report. That completes the walkthrough."

---

## 04:10 – 04:20 · Closing

**[Screen]** Return to the /reportes hub or the home view.

**[Narration]**

> "Thank you for reviewing MetaSuite. The video covered every requested permission: business_management for multi-account access, pages_show_list for the Facebook Page dropdown, instagram_basic for Instagram account selection, ads_management for paused campaign creation, ads_read for the reports dashboard, and pages_read_engagement for page-level metrics. The full use case is described in the attached instructions document."

**[Screen]** Stop recording.

---

## Post-recording checklist before uploading

- [ ] Open the recording in a player and confirm resolution is 1080p or higher.
- [ ] Confirm the entire OAuth consent dialog is visible and readable.
- [ ] Confirm every section lasts at least 15 seconds so the reviewer can follow.
- [ ] Generate English subtitles (YouTube auto-captions work, then export .srt and burn-in, or use any other tool).
- [ ] Export as .mp4, H.264, below 2 GB (Meta's cap).
- [ ] Upload as a single file attached to each permission's video field in the App Review form. (You can upload the same file for every permission — Meta explicitly allows this.)
- [ ] In each permission's text area, paste "See master video. Relevant segment: 00:55-01:25 (business_management)" etc., replacing timestamps per permission.
- [ ] Attach the updated `meta-app-review-instructions.txt` under "Supporting documentation".

## If something in the demo fails
If the OAuth flow, an API call, or campaign creation errors out during the recording, STOP, fix it, and re-record from the top. Do not upload a video that shows errors — Meta will reject it.

## Per-permission timestamp cheat sheet (copy into each field)

```
Master video walkthrough. Relevant segment for this permission:

  business_management    00:55 – 01:25
  pages_show_list        01:25 – 01:55
  instagram_basic        01:55 – 02:20
  ads_management         02:20 – 03:15
  ads_read               03:15 – 03:50
  pages_read_engagement  03:50 – 04:10

Full context for every permission is in the attached
meta-app-review-instructions.txt document.
```
