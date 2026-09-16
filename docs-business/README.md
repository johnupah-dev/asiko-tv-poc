# Asiko TV — Business & Partnerships Docs

Curated from the "Asikohib1x" (batch 1), "Asiko_hub3x" (batch 2), and "Asikohub5x"
(batch 3) archives — the wider Asiko project document collection. ("Asikohub4x" was
reviewed and found to be a strict subset of hub5x — every one of its 18 files is
byte-identical to a file already in hub5x — so it was not imported separately.)

Sibling to [`docs-vision/`](../docs-vision) (product/architecture strategy docs).
This folder holds the **commercial, partnership, and brand** side: pitch decks,
vendor proposals, signed agreements, and playbooks.

> **Confidentiality note:** `confidential/` (personal documents/photos tied to a named
> individual), `proposals-contracts/` (signed/vendor-negotiation material — DPA, Enveu
> and Immergo proposals, the Immergo call transcript, Asiko's own response-to-Enveu
> deck), and `financials/` (P&L and financial models) are **not tracked in git** — see
> `.gitignore`. This repo is public, so only material with no personal data, signed
> contract terms, vendor pricing/negotiation content, or detailed financials gets
> committed here. Those three folders exist on disk locally (this session's working
> copy only) for reference but are not part of the repo history and will not survive
> past this session/container. If you need them kept somewhere durable, they should
> go in private storage (e.g. a private Drive folder), not this repo.

## Index

### `playbooks/`
- `Asiko-TV-Content-Negotiation-Onboarding-Monetisation-Playbook.md` — content deal/onboarding/monetisation playbook (source markdown)
- `FAST_Linear_OnDemand_Industry_Playbook.pdf` — industry primer on FAST/linear/on-demand models
- `The_African_FAST_Platform_Playbook.pdf` — Africa-specific FAST platform playbook
- `Asiko_TV_Marketing_Brand_Bible_Channel_Strategy_Playbook.md` — brand bible & channel strategy
- `Asiko-TV-Buy-vs-Build-Distribution-Plan.md` — buy-vs-build distribution plan
- `Asiko_SelfServe_Ad_Service.docx` — self-serve ad service product spec

### `decks/`
- `Asiko-TV-Content-Playbook.pptx` — content playbook deck
- `Category_Exclusivity_30_Sectors.pptx` / `.pdf` — 30-sector category exclusivity pitch (source deck + exported PDF)
- `Generation_Next_Master_Prospectus.pptx` — investor prospectus
- `Business Mastery Series - August Webinar Presentation Deck.pptx` — webinar deck
- `HOME_TV_Africa_Brand_Deck_updated.pptx` — brand deck
- `Asiko_TV_Full_Channel_Bouquet.pptx` (49 slides) / `_alt-55slide.pptx` / `_alt-57slide.pptx` — **three different slide counts, not duplicates.** These came from separate archives as the "same" deck name; nobody has confirmed which is canonical — check before using externally
- `Asiko_TV_Full_Build_Picture.pptx` — full build picture deck
- `Asiko_TV_Consolidated_Revenue_Architecture.pptx` — Asiko's own consolidated revenue model deck
- `Asiko_TV_Stack_Reminder_v2.pptx` — tech stack reminder deck
- `Asiko Ecosystem - Funding Pitch Deck.pptx` — investor funding pitch deck
- `Asiko TV x EXMAN - Events Economy Partnership.pptx` — EXMAN events-economy partnership deck
- `Asiko_POC_to_MVP_Proof_Plan.pptx` — POC→MVP proof plan
- `asikomonetizationonepager.pdf` — monetisation one-pager

### `marketing/`
- `Asiko_60_LinkedIn_Posts_OTT_Journey.docx` — 60-post LinkedIn content series (OTT journey)

### `briefs/`
- `Asiko-TV-Upgrade-Brief.docx` — platform upgrade brief
- `Asiko_TV_Slide_Deck_Glossary.docx` — glossary of terms used across the decks

### `brand-assets/`
- `og-share.jpg` — social-share image (not currently wired into any page's `og:image` meta tag — flagging in case that was the intent)
- `ChatGPT Image Sep 5, 2026, 10_43_26 PM.png`, `10_46_27 PM.png` — AI-generated brand/concept art

---

### `proposals-contracts/` (git-ignored, not pushed)
- `Enveu_Proposal_AsikoAfrica_v1.pdf` (earliest, 1 Sep 06:05) / `_v2.pdf` (revised, 1 Sep 06:07–08) — Enveu vendor proposal, Asiko Africa
- `Enveu_Proposal_AsikoTV_FAST_Build_v1.pdf` / `_v3.pdf` — Enveu FAST build proposal versions (no v2 was supplied)
- `Media_Icons_Africa_Consultancy_Proposal.pdf` / `_word-export.pdf` — consultancy proposal, original export + Word-derived export
- `bunny.net DPA v2 05 Sep 2026.pdf` — signed Data Processing Agreement with bunny.net (CDN/storage vendor)
- `Asiko_TV_Partnership_Proposal_Immergo.docx` / `_v2.docx` — Immergo partnership proposal, two versions
- `Asiko_Africa_Enveu_One_Page_Financial_Overview.docx` / `.pdf` — Enveu-specific financial overview
- `Asiko & Immergo - Intro Transcript.txt` / `- Intro Recap.txt` — call transcript & recap with Immergo (likely contains named individuals)
- `Asiko_TV_Response_to_Enveu.pptx` — Asiko's response deck to Enveu's proposal (engages vendor-specific terms)

### `financials/` (git-ignored, not pushed)
- `Asiko_TV_PnL_Model.xlsx` — P&L model
- `Asiko Ecosystem - 3-Year Financial Model.xlsx` — 3-year financial model
- `asiko_model.xlsx` — financial model
- `Asiko_TV_Year1_Business_Case.docx` — year-1 business case with financial projections
- `Asiko-Master-Revenue-Streams-and-Brutal-Reality-Check.md` — **start here for revenue.** Consolidates all 21 revenue streams found across every document into one taxonomy, reconciles the four financial models above (which don't agree with each other), and calls out unverified/placeholder figures by name

### `confidential/` (git-ignored, not pushed)
- `Blessing Aguofore.pdf`, `BTA Blessing Aguouore.pdf` — personal/financial documents for a named individual
- `Pat-Obilor-personal-banner.jpg` (source filename `1685419628020.jpg`) — a personal branding banner for a named individual with a personal email address

Treat everything in this section as restricted; do not forward or expose outside private storage you control.

## Curation notes (batch 1)

The source archive had exact duplicate files (same content, different filenames/timestamps)
and one obviously-mistyped filename. These were deduplicated on import:

- `Asiko-TV-Content-Playbook.pptxxx.pptx` → dropped (byte-identical dup of `Asiko-TV-Content-Playbook.pptx`, typo'd filename)
- `Category_Exclusivity_30_Sectors(1).pdf` → dropped (near-identical to the kept `.pdf`, same size)
- `Enveu_Proposal_AsikoAfrica (1).pdf` / `(2).pdf` → collapsed to one file, kept as `_v2.pdf` (the two were byte-identical to each other)
- `Enveu_Proposal_AsikoTV_FAST_Build_v1 (1).pdf` → dropped (byte-identical dup of `_v1.pdf`)
- `FAST_Linear_OnDemand_Industry_Playbook (1).pdf` → dropped (byte-identical dup)
- `Media_Icons_Africa_Consultancy_Proposal Word (1).pdf` → dropped (byte-identical dup of `_word-export.pdf`)
- `ChatGPT Image Sep 5, 2026, 10_47_10 PM.png` → dropped (byte-identical dup of the `10_46_27 PM` image)
- Source `README.txt` (about a 54-banner montage export) → not carried over; it didn't match this archive's actual contents (no banner images were present in this batch)

## Curation notes (batches 2 & 3 — hub3x, hub4x, hub5x)

- `Asikohub4x.zip` (18 files) → **not imported separately.** Every file in it is
  byte-identical (same md5) to a file already present in `Asikohub5x.zip`, so hub5x
  was treated as the authoritative copy of that set.
- Exact duplicates within hub4x/hub5x collapsed to one file each: `Asiko_TV_Response_to_Enveu (2).pptx`,
  `asikomonetizationonepager (1).pdf`, `Asiko-TV-Buy-vs-Build-Distribution-Plan_1.md`,
  `Asiko_TV_Year1_Business_Case.docxx.docx` (typo'd name), `Asiko_60_LinkedIn_Posts_OTT_Journey (1/2/3).docx`,
  `Asiko_POC_to_MVP_Proof_Plan (1).pptx`, `asiko_model.xlsxxx.xlsx` (typo'd name) — all dropped as byte-identical dupes.
- `Asiko TV  Revised Architecture Response to Enveu v3.docx` / `.pdf` (from hub5x) → **not re-imported**;
  byte-identical to the file already tracked at `docs-vision/Asiko TV - Revised Architecture (Response to Enveu v3).docx/.pdf`.
- `Asiko_TV_Year1_Business_Case.docx` (from hub4x/hub5x) → filed under `financials/` (git-ignored);
  it's a detailed internal business case with financial projections.
- One file in hub5x, `1788276040870.jpg`, is **not an Asiko asset at all** — it's an unrelated
  "Claude 101" promotional graphic (a guide to using Claude). It was excluded entirely (not filed
  anywhere in this repo). Worth checking how it ended up in the export.
- `1685419628020.jpg` → identified as a personal branding banner for a named individual
  ("Pat Obilor") including a personal email address; filed under `confidential/`, not `brand-assets/`.

**Still pending:** nothing — all supplied archives (batches 1–3) have now been processed.
