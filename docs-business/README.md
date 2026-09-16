# Asiko TV — Business & Partnerships Docs

Curated from the "Asikohib1x" archive (batch 1 of the wider Asiko project document
collection; a second batch is expected and will be merged into this same structure).

Sibling to [`docs-vision/`](../docs-vision) (product/architecture strategy docs).
This folder holds the **commercial, partnership, and brand** side: pitch decks,
vendor proposals, signed agreements, and playbooks.

> **Confidentiality note:** `confidential/` (a named individual's personal/financial
> documents) and `proposals-contracts/` (a signed vendor DPA and vendor pricing
> proposals) are **not tracked in git** — see `.gitignore`. This repo is public, so
> only material with no personal data, signed contract terms, or vendor pricing gets
> committed here. Those two folders exist on disk locally (this session's working
> copy only) for reference but are not part of the repo history and will not survive
> past this session/container. If you need them kept somewhere durable, they should
> go in private storage (e.g. a private Drive folder), not this repo.

## Index

### `playbooks/`
- `Asiko-TV-Content-Negotiation-Onboarding-Monetisation-Playbook.md` — content deal/onboarding/monetisation playbook (source markdown)
- `FAST_Linear_OnDemand_Industry_Playbook.pdf` — industry primer on FAST/linear/on-demand models
- `The_African_FAST_Platform_Playbook.pdf` — Africa-specific FAST platform playbook

### `decks/`
- `Asiko-TV-Content-Playbook.pptx` — content playbook deck
- `Category_Exclusivity_30_Sectors.pptx` / `.pdf` — 30-sector category exclusivity pitch (source deck + exported PDF)
- `Generation_Next_Master_Prospectus.pptx` — investor prospectus
- `Business Mastery Series - August Webinar Presentation Deck.pptx` — webinar deck
- `HOME_TV_Africa_Brand_Deck_updated.pptx` — brand deck

### `proposals-contracts/`
- `Enveu_Proposal_AsikoAfrica_v1.pdf` (earliest, 1 Sep 06:05) / `_v2.pdf` (revised, 1 Sep 06:07–08) — Enveu vendor proposal, Asiko Africa
- `Enveu_Proposal_AsikoTV_FAST_Build_v1.pdf` / `_v3.pdf` — Enveu FAST build proposal versions (no v2 was supplied)
- `Media_Icons_Africa_Consultancy_Proposal.pdf` / `_word-export.pdf` — consultancy proposal, original export + Word-derived export
- `bunny.net DPA v2 05 Sep 2026.pdf` — signed Data Processing Agreement with bunny.net (CDN/storage vendor)

### `confidential/`
- `Blessing Aguofore.pdf`, `BTA Blessing Aguouore.pdf` — personal/financial documents for a named individual. Treat as restricted; do not forward or expose outside this private repo.

### `brand-assets/`
- `og-share.jpg` — social-share image (not currently wired into any page's `og:image` meta tag — flagging in case that was the intent)
- `ChatGPT Image Sep 5, 2026, 10_43_26 PM.png`, `10_46_27 PM.png` — AI-generated brand/concept art

### `briefs/`
- `Asiko-TV-Upgrade-Brief.docx` — platform upgrade brief

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

**Still pending:** batch 2 ("Asikohub.2x") — will be reviewed and merged into this same folder scheme on arrival.
