# Anti-Anxiety Browsing Features

## Epic Overview

Reduce browsing anxiety - the fear of losing tabs, forgetting how you got somewhere, and tab overwhelm.

## Testing Requirements

Every task MUST include tests. Before marking a task complete:

1. Write unit tests for utility functions
2. Add E2E tests to `test-browser.cjs`
3. Run `npm run build` - must pass
4. Run `node test-browser.cjs` - must pass

---

## Task 1: Cookie Jar (Safety Net)

**Dependencies:** None

### User Story

As a user, I want closed tabs to be saved automatically so that I never lose something important by accident.

### Acceptance Criteria

- [ ] When I close a tab, it goes to the "Cookie Jar" instead of disappearing
- [ ] I can access the Cookie Jar from a button in the toolbar (🫙)
- [ ] The Cookie Jar page (cookie://jar) shows all my recently closed tabs
- [ ] Each entry shows: page title, URL, favicon, and how long ago it was closed
- [ ] I can click an entry to restore that tab
- [ ] Tabs automatically expire after 7 days
- [ ] The Cookie Jar persists across browser restarts

### Technical Notes

- Store in localStorage under key `cookie-jar`
- Each entry needs: id, url, title, favicon, closedAt, expiresAt
- Create `src/utils/cookieJar.ts` for storage logic
- Create `src/pages/CookieJarPage.tsx` for the UI
- Style should match the cozy aesthetic of other pages

### Tests Required

**Unit tests** - Create `src/utils/__tests__/cookieJar.test.ts`:
- `addToJar()` stores entry with correct timestamps
- `getJar()` returns all entries
- `restoreFromJar()` removes and returns entry
- `cleanExpired()` removes old entries

**E2E tests** - Add to `test-browser.cjs`:
- Close a tab → verify it appears in Cookie Jar
- Open cookie://jar → verify entries display
- Click entry → verify tab restores

---

## Task 2: Breadcrumbs

**Dependencies:** Task 1 (Cookie Jar)

### User Story

As a user, I want to see how I got to the current page so that I can retrace my steps and understand my browsing journey.

### Acceptance Criteria

- [ ] Each tab tracks its navigation history (the path I took to get here)
- [ ] There's a "How did I get here?" button in the toolbar (🍞)
- [ ] Clicking it shows a popover with my path: Site A → Site B → Site C → Current
- [ ] Each step in the path is clickable to go back to that page
- [ ] When a tab is saved to the Cookie Jar, its breadcrumb trail is saved too
- [ ] Breadcrumbs are per-tab (each tab has its own trail)

### Technical Notes

- Create `src/utils/breadcrumbs.ts` to track trails per tab
- Create `src/components/BreadcrumbsPopover.tsx` for the UI
- Store trail as array of {url, title, timestamp}
- Integrate with Cookie Jar so restored tabs remember their history

### Tests Required

**Unit tests** - Create `src/utils/__tests__/breadcrumbs.test.ts`:
- `addCrumb()` builds trail correctly
- `getTrail()` returns trail for specific tab
- Trails are isolated per tab
- `clearTrail()` removes trail

**E2E tests** - Add to `test-browser.cjs`:
- Navigate through 3 pages → click breadcrumbs button → verify trail shows
- Click a crumb → verify navigation to that page

---

## Task 3: Easy Closure

**Dependencies:** Task 1 (Cookie Jar) AND Task 2 (Breadcrumbs)

### User Story

As a user, I want a way to save all my current tabs as a "session" and close them, so that I can start fresh without losing my work.

### Acceptance Criteria

- [ ] There's an "I'm Done" button in the toolbar (✨)
- [ ] Clicking it opens a modal asking "Save these tabs as a session?"
- [ ] I can give the session a name (default: "Session - Jan 28, 4:30pm")
- [ ] "Save & Close" saves all tabs to Cookie Jar as a group and closes them
- [ ] "Just Close" closes without saving
- [ ] In the Cookie Jar, sessions appear as a group I can expand
- [ ] I can restore an entire session with one click
- [ ] Each tab in the session keeps its breadcrumbs

### Technical Notes

- Extend `src/utils/cookieJar.ts` with saveSession/getSessions/restoreSession
- Create `src/components/EasyCloseModal.tsx`
- Sessions are stored separately from individual jar entries
- A session contains: id, name, savedAt, tabs[]

### Tests Required

**Unit tests** - Add to `src/utils/__tests__/cookieJar.test.ts`:
- `saveSession()` stores multiple tabs as a group
- `getSessions()` returns all sessions
- `restoreSession()` returns all tabs in session

**E2E tests** - Add to `test-browser.cjs`:
- Open multiple tabs → click "I'm Done" → verify modal appears
- Enter name, click "Save & Close" → verify tabs close
- Open cookie://jar → verify session appears
- Click restore session → verify all tabs reopen
