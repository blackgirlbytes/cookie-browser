# Cookie Rendering Engine

## Epic Overview

Build a custom rendering engine for Cookie Browser's internal pages (cookie://*). Instead of using Chromium for everything, internal pages will be rendered by our own engine.

This is a long-running project broken into phases.

## Testing Requirements

Every phase MUST include tests. Before marking a phase complete:

1. Write unit tests for all new functions
2. Run `npm run build` - must pass
3. Run `npm test` - must pass
4. For Phase 6, also run `node test-browser.cjs` - must pass

---

## Phase 1: HTML Parser

**Dependencies:** None

### User Story

As a developer, I want to parse HTML strings into a DOM tree so that we can process and render HTML ourselves.

### Acceptance Criteria

- [ ] Tokenizer converts HTML string into tokens (startTag, endTag, text, etc.)
- [ ] Parser converts tokens into a tree structure
- [ ] Handles nested elements correctly
- [ ] Preserves attributes on elements
- [ ] Handles self-closing tags (img, br, etc.)
- [ ] Supports basic tags: div, span, p, h1-h6, a, img, ul, ol, li, strong, em

### Technical Notes

- Create `src/engine/html/tokenizer.ts`
- Create `src/engine/html/parser.ts`
- Create `src/engine/html/index.ts` with `parseHTML(html: string): DOMNode`
- DOMNode type: { type, tagName?, attributes?, children, textContent? }

### Tests Required

Create `src/engine/html/__tests__/parser.test.ts`:

```typescript
describe('HTML Parser', () => {
  test('parses simple element', () => {
    const dom = parseHTML('<div>Hello</div>');
    expect(dom.tagName).toBe('div');
    expect(dom.children[0].textContent).toBe('Hello');
  });

  test('parses nested elements', () => {
    const dom = parseHTML('<div><p>Text</p></div>');
    expect(dom.tagName).toBe('div');
    expect(dom.children[0].tagName).toBe('p');
  });

  test('parses attributes', () => {
    const dom = parseHTML('<a href="https://example.com" class="link">Click</a>');
    expect(dom.attributes.get('href')).toBe('https://example.com');
    expect(dom.attributes.get('class')).toBe('link');
  });

  test('handles self-closing tags', () => {
    const dom = parseHTML('<div><img src="test.png" /><p>After</p></div>');
    expect(dom.children).toHaveLength(2);
    expect(dom.children[0].tagName).toBe('img');
  });

  test('handles multiple root-level text and elements', () => {
    const dom = parseHTML('<p>One</p><p>Two</p>');
    // Should wrap in a root or handle appropriately
  });
});
```

---

## Phase 2: CSS Parser

**Dependencies:** Phase 1 (HTML Parser)

### User Story

As a developer, I want to parse CSS strings into a stylesheet structure so that we can apply styles to our DOM.

### Acceptance Criteria

- [ ] Tokenizer converts CSS string into tokens
- [ ] Parser creates rules with selectors and declarations
- [ ] Supports tag selectors (div, p)
- [ ] Supports class selectors (.container)
- [ ] Supports ID selectors (#header)
- [ ] Parses multiple declarations per rule
- [ ] Parses multiple rules per stylesheet

### Technical Notes

- Create `src/engine/css/tokenizer.ts`
- Create `src/engine/css/parser.ts`
- Create `src/engine/css/index.ts` with `parseCSS(css: string): Stylesheet`
- Supported properties: color, background, margin, padding, border, width, height, font-size, font-family, display

### Tests Required

Create `src/engine/css/__tests__/parser.test.ts`:

```typescript
describe('CSS Parser', () => {
  test('parses tag selector', () => {
    const stylesheet = parseCSS('div { color: red; }');
    expect(stylesheet.rules[0].selectors[0].type).toBe('tag');
    expect(stylesheet.rules[0].selectors[0].value).toBe('div');
  });

  test('parses class selector', () => {
    const stylesheet = parseCSS('.container { width: 100%; }');
    expect(stylesheet.rules[0].selectors[0].type).toBe('class');
    expect(stylesheet.rules[0].selectors[0].value).toBe('container');
  });

  test('parses ID selector', () => {
    const stylesheet = parseCSS('#header { height: 60px; }');
    expect(stylesheet.rules[0].selectors[0].type).toBe('id');
    expect(stylesheet.rules[0].selectors[0].value).toBe('header');
  });

  test('parses multiple declarations', () => {
    const stylesheet = parseCSS('div { color: red; margin: 10px; padding: 5px; }');
    expect(stylesheet.rules[0].declarations).toHaveLength(3);
  });

  test('parses multiple rules', () => {
    const stylesheet = parseCSS('div { color: red; } p { color: blue; }');
    expect(stylesheet.rules).toHaveLength(2);
  });
});
```

---

## Phase 3: Style Resolution

**Dependencies:** Phase 1 (HTML Parser) AND Phase 2 (CSS Parser)

### User Story

As a developer, I want to match CSS rules to DOM nodes and compute final styles so that each element knows how it should look.

### Acceptance Criteria

- [ ] Selector matching works (tag, class, id)
- [ ] Specificity is calculated correctly (id > class > tag)
- [ ] Higher specificity rules win
- [ ] Inherited properties cascade to children (color, font-size)
- [ ] Non-inherited properties don't cascade (margin, padding)
- [ ] Default browser styles are applied

### Technical Notes

- Create `src/engine/style/matcher.ts` - matches selectors to nodes
- Create `src/engine/style/specificity.ts` - calculates specificity
- Create `src/engine/style/compute.ts` - computes final styles
- Create `src/engine/style/index.ts` with `styleTree(dom, stylesheet): StyledNode`

### Tests Required

Create `src/engine/style/__tests__/style.test.ts`:

```typescript
describe('Style Resolution', () => {
  test('matches tag selector', () => {
    const dom = parseHTML('<div>Hello</div>');
    const css = parseCSS('div { color: red; }');
    const styled = styleTree(dom, css);
    expect(styled.styles.color).toBe('red');
  });

  test('matches class selector', () => {
    const dom = parseHTML('<div class="highlight">Hello</div>');
    const css = parseCSS('.highlight { color: yellow; }');
    const styled = styleTree(dom, css);
    expect(styled.styles.color).toBe('yellow');
  });

  test('higher specificity wins', () => {
    const dom = parseHTML('<div class="highlight">Hello</div>');
    const css = parseCSS('div { color: red; } .highlight { color: yellow; }');
    const styled = styleTree(dom, css);
    expect(styled.styles.color).toBe('yellow'); // class beats tag
  });

  test('inherits color to children', () => {
    const dom = parseHTML('<div><span>Hello</span></div>');
    const css = parseCSS('div { color: blue; }');
    const styled = styleTree(dom, css);
    expect(styled.children[0].styles.color).toBe('blue');
  });

  test('does not inherit margin', () => {
    const dom = parseHTML('<div><span>Hello</span></div>');
    const css = parseCSS('div { margin: 10px; }');
    const styled = styleTree(dom, css);
    expect(styled.children[0].styles.margin).not.toBe('10px');
  });
});
```

---

## Phase 4: Layout Engine

**Dependencies:** Phase 3 (Style Resolution)

### User Story

As a developer, I want to calculate the position and size of every element so that we know where to draw things.

### Acceptance Criteria

- [ ] Box model calculated (content + padding + border + margin)
- [ ] Block elements stack vertically
- [ ] Inline elements flow horizontally
- [ ] Width calculations work (auto, fixed, percentage)
- [ ] Height is based on content
- [ ] Nested layouts work correctly

### Technical Notes

- Create `src/engine/layout/box.ts` - box model types
- Create `src/engine/layout/block.ts` - block layout
- Create `src/engine/layout/inline.ts` - inline layout
- Create `src/engine/layout/index.ts` with `layoutTree(styledRoot, width, height): LayoutTree`

### Tests Required

Create `src/engine/layout/__tests__/layout.test.ts`:

```typescript
describe('Layout Engine', () => {
  test('calculates box model', () => {
    const dom = parseHTML('<div>Hello</div>');
    const css = parseCSS('div { width: 100px; padding: 10px; margin: 5px; }');
    const styled = styleTree(dom, css);
    const layout = layoutTree(styled, 800, 600);
    
    expect(layout.box.content.width).toBe(100);
    expect(layout.box.padding.left).toBe(10);
    expect(layout.box.margin.left).toBe(5);
  });

  test('block elements stack vertically', () => {
    const dom = parseHTML('<div><p>One</p><p>Two</p></div>');
    const css = parseCSS('p { height: 20px; }');
    const styled = styleTree(dom, css);
    const layout = layoutTree(styled, 800, 600);
    
    const p1 = layout.children[0];
    const p2 = layout.children[1];
    expect(p2.box.content.y).toBeGreaterThan(p1.box.content.y);
  });

  test('percentage width relative to parent', () => {
    const dom = parseHTML('<div><span>Hello</span></div>');
    const css = parseCSS('div { width: 200px; } span { width: 50%; }');
    const styled = styleTree(dom, css);
    const layout = layoutTree(styled, 800, 600);
    
    expect(layout.children[0].box.content.width).toBe(100);
  });
});
```

---

## Phase 5: Painting

**Dependencies:** Phase 4 (Layout Engine)

### User Story

As a developer, I want to render the layout tree to a canvas so that users can actually see the page.

### Acceptance Criteria

- [ ] Canvas painter class created
- [ ] Backgrounds render correctly
- [ ] Borders render on all sides
- [ ] Text renders with correct font, size, color
- [ ] Images load and display
- [ ] Full page renders correctly

### Technical Notes

- Create `src/engine/paint/canvas.ts` - Painter class
- Create `src/engine/paint/render.ts` - paint function
- Create `src/engine/paint/index.ts` with `render(html, css, canvas)`

### Tests Required

Create `src/engine/paint/__tests__/paint.test.ts`:

```typescript
describe('Painting', () => {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    ctx = canvas.getContext('2d')!;
  });

  test('renders without throwing', () => {
    const html = '<div>Hello World</div>';
    const css = 'div { color: black; }';
    expect(() => render(html, css, canvas)).not.toThrow();
  });

  test('clears canvas before rendering', () => {
    const clearSpy = jest.spyOn(ctx, 'clearRect');
    render('<div>Test</div>', '', canvas);
    expect(clearSpy).toHaveBeenCalled();
  });

  test('renders text', () => {
    const fillTextSpy = jest.spyOn(ctx, 'fillText');
    render('<p>Hello</p>', '', canvas);
    expect(fillTextSpy).toHaveBeenCalledWith('Hello', expect.any(Number), expect.any(Number));
  });
});
```

---

## Phase 6: Integration

**Dependencies:** Phase 5 (Painting)

### User Story

As a user, I want Cookie Browser's internal pages to use the custom rendering engine so that the browser feels truly handcrafted.

### Acceptance Criteria

- [ ] CookieRenderer React component works
- [ ] cookie://jar renders with custom engine
- [ ] cookie://newtab renders with custom engine
- [ ] cookie://history renders with custom engine
- [ ] cookie://settings renders with custom engine
- [ ] Toggle in settings to enable/disable custom renderer
- [ ] No visual regression from React versions

### Technical Notes

- Create `src/engine/CookieRenderer.tsx` - React wrapper
- Modify internal pages to optionally use CookieRenderer
- Add setting to toggle between React and custom renderer

### Tests Required

**Unit tests** - Create `src/engine/__tests__/CookieRenderer.test.tsx`:

```typescript
describe('CookieRenderer', () => {
  test('renders without crashing', () => {
    render(<CookieRenderer html="<div>Test</div>" css="" />);
  });

  test('creates canvas element', () => {
    const { container } = render(<CookieRenderer html="<div>Test</div>" css="" />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });
});
```

**E2E tests** - Add to `test-browser.cjs`:

```javascript
// Test: Custom renderer toggle
try {
  // Go to settings
  const settingsBtn = await window.locator('button[aria-label="Settings"]').first();
  await settingsBtn.click();
  await window.waitForTimeout(1000);

  // Find and enable custom renderer toggle
  const toggle = await window.locator('[data-testid="custom-renderer-toggle"]').first();
  await toggle.click();
  await window.waitForTimeout(500);
  console.log('✓ Custom renderer toggle works');

  // Navigate to an internal page
  const homeBtn = await window.locator('button[aria-label="Home"]').first();
  await homeBtn.click();
  await window.waitForTimeout(1000);

  // Verify page renders (canvas should be present)
  const canvas = await window.locator('canvas').first();
  await canvas.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✓ Internal page renders with custom engine');
} catch (e) {
  console.log('✗ Custom renderer test failed:', e.message);
}
```
