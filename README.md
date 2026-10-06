# វាយតម្លៃឥណទាន · Field Loan Assessment

Tablet workspace for credit officers, pawnshop appraisers, and community financial agents who assess collateral, debt service, and household cash flow while sitting with a borrower.

Provincial visits often have no signal. The application keeps every file on the tablet and uploads it when the device is back in range. Repayment schedules of 24–36 months stay on one wide ledger, which is why the layout is built for a landscape tablet rather than a phone.

## What a visit can do

- Build a live amortization schedule in Khmer riel or US dollars.
- Compare **flat rate** and **declining balance** at the same nominal annual rate, including the effective annual rate so those two quotes are not treated as the same price.
- Record household income, living costs, and existing debts, then read the debt-service ratio against 40%, 50%, and 70% field guideposts.
- Photograph a hard title, soft title, land boundary, or vehicle. The picture is stamped with the time, the officer, and the GPS fix, then stored on the borrower.
- Keep working with sync paused or with no network. Queued changes upload to `/api/sync` once the tablet is online again.
- Switch the whole workspace between Khmer and English. Figures stay in Arabic numerals, which is how branch ledgers are written.
- Print the schedule or download it as CSV.

The 40 / 50 / 70 markers are a field signal for the conversation. They are not a credit approval.

## Calculation rules

Money is handled in integer minor units: US cents, or whole riel rounded to the nearest 100 for installments (nearest riel when the amount is under ៛1,000). The principal column sums back to the amount disbursed. The last month absorbs the rounding so the balance finishes at zero.

**Flat rate.** Each month’s interest is `principal × annual rate ÷ 12`. Principal is spread evenly. A $1,000 loan at 18% for 24 months has interest of $15.00 every month, a regular installment of $56.67, and total interest of $360.00.

**Declining balance.** This is an annuity. Interest each month is charged only on the outstanding principal, and the installment stays level until the final rounding row. At the same 18% nominal rate the total interest is lower than the flat contract, and the effective annual rate sits close to the compounded monthly rate.

**Debt-service ratio.** `(existing monthly debts + new installment) ÷ household income`. Living costs are kept out of that ratio so a food budget is not counted as a loan payment. They are still subtracted to show cash left over. If the family earns riel and the contract is in dollars, the installment is converted at the rate written on that application.

Sample files are loaded on first open so the tablet is usable before the first real visit. They are marked គំរូ / Sample. Names, ID numbers, and phone numbers in those files are fictional.

## Offline storage and sync

The tablet database is IndexedDB (Dexie), with separate stores for borrowers, loan terms, collateral photos, a sync queue, and the officer profile. That is the same offline shape as a Room database on Android: local entities, a queue of changes, and a flush when the network returns.

- Edits are saved on the device about half a second after the officer stops typing.
- Each save adds or updates one queued upload.
- While **Pause sync** is on, or the browser reports no network, nothing leaves the tablet.
- Unpausing, coming back online, or tapping the status pill flushes the queue to `POST /api/sync`.
- The dev server writes assessment JSON to `data/sync-inbox.json` and GPS-stamped photos to `data/photos/`. Both paths are local runtime data and are not part of the source tree.
- A production core-banking endpoint can replace that route. The queue already sends borrower, loan, and photo payloads, and it retries after an error.

Install the built app to the tablet home screen. The service worker caches the shell, including the Khmer font, so the workspace reopens without coverage.

## Run it

```bash
npm install
npm test
npm run dev
```

Open the dev server in a landscape tablet window (around 1280×800). `npm run build` then `npm test` is the check used before a branch build; `npm run preview` serves the installable build.

Officer profile, language, and the default exchange rate for new files live in the name button at the top. Each application keeps the rate that was on the file when it was assessed.
