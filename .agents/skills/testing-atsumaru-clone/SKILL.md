---
name: testing-atsumaru-clone
description: Test the Atsumaru clone (manga reader) end-to-end. Use when verifying UI, API, auth, or data changes.
---

# Testing the Atsumaru Clone

## Prerequisites

1. Node.js and npm installed
2. Run `npm install` in the project root
3. Run `npx prisma db push` to create/sync the database
4. Run `npm run seed` to seed sample manga data
5. Create a `.env` file with:
   - `DATABASE_URL="file:./dev.db"`
   - `NEXTAUTH_SECRET` (any random string)
   - `NEXTAUTH_URL="http://localhost:3000"`

## Devin Secrets Needed

- `NEXTAUTH_SECRET` — any random string for JWT signing (can be generated locally, no external service needed)

## Starting the App

```bash
cd /home/ubuntu/repos/atsumaru-clone
npm run dev
```

The app runs at `http://localhost:3000`.

## E2E Test Flow

Test these features in order (each builds on the previous):

### 1. Homepage Carousels
- Navigate to `/`
- Verify 7 sections: Trending, Most Bookmarked, Hot Updates, Recently Updated, Top Rated, Popular, Recently Added
- Each section should show manga cards with covers and titles
- **Known issue**: If all seeded manga share the same `updatedAt` timestamp, "Hot Updates" and "Recently Updated" may show identical content. This is a data-dependent issue, not a code bug.

### 2. Search
- Click the search bar (or press Ctrl+K)
- Type a manga name (e.g., "one piece")
- A dropdown should appear after ~300ms with matching results showing title, type badge, and thumbnail

### 3. Manga Detail
- Click a search result or navigate to `/manga/<slug>`
- Verify: title, type badge, author, genre tags, stats (status, rating, views, chapters), bookmark button, comments section, chapter list

### 4. Chapter Reader
- Click any chapter from the detail page
- Verify: dark background, manga title in header, chapter label, page images, prev/next navigation, chapter selector dropdown

### 5. Auth (Signup)
- Navigate to `/auth`
- Fill in username, email, password and submit
- Should redirect to homepage with username in navbar
- **Tip**: Use a unique username each test run (e.g., `testuser-<timestamp>`)

### 6. Bookmark Toggle
- While logged in, go to any manga detail page
- Click "Bookmark" — should change to "Bookmarked" with purple background
- Click again — should revert to "Bookmark"

### 7. Comment Posting
- While logged in on a manga detail page, type in the comment textarea
- "Post Comment" button should appear
- After posting, comment should appear in the list with username and date
- Textarea should clear

### 8. Browse Pagination
- Navigate to `/browse/trending`
- Should show grid of manga cards (24 per page)
- With 30 seeded manga, should show "Page 1 of 2" with a "Next" link

### 9. Explore Filters
- Navigate to `/explore`
- Select "Manhwa" from the Type dropdown
- Results count should decrease (from 30 to ~14)
- All visible cards should show the "Manhwa" badge only

## Tips

- The app uses NextAuth with JWT strategy — sessions persist in browser cookies
- The SQLite database is at `prisma/dev.db` — you can reset it by deleting the file and re-running `npx prisma db push && npm run seed`
- For select dropdowns on the Explore page, use native click interactions (click the select, then click the option) rather than programmatic `select_option`
- The search bar has a 300ms debounce — wait for the dropdown to appear after typing
- Bookmark and comment APIs require authentication — test these after signing up/logging in
- If the dev server shows stale data, try hard-refreshing the page (Ctrl+Shift+R)
