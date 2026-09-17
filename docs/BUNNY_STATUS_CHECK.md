# Bunny account status checker

This read-only GitHub Action checks the Bunny account endpoint and writes a safe summary containing any billing signals returned by Bunny, including balance, monthly charges, payment status, billing type, trial state, and suspension state.

It never prints the API key, account email, card details, or the raw Bunny response.

## One-time setup

1. In Bunny, create a **new** account API key. Do not reuse the revoked key.
2. Open this GitHub repository.
3. Select **Settings → Secrets and variables → Actions**.
4. Select **New repository secret**.
5. Use the name `BUNNY_API_KEY`.
6. Paste the new key into GitHub's secret-value field and save it. Never add it to a repository file, issue, pull request, or chat.

## Run the check

1. Open **Actions** in GitHub.
2. Select **Bunny account status**.
3. Select **Run workflow**.
4. Open the completed run and read its **Summary**.

A successful API check does not guarantee that a card is valid or that every invoice is paid. Use Bunny's Billing dashboard for card-specific information, invoice documents, and payment remediation.
