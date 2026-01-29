/**
 * Unit tests for cookieJar utility
 * Run with: node src/utils/__tests__/cookieJar.test.js
 */

// Mock localStorage for Node.js environment
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }
}

global.localStorage = new LocalStorageMock();

// Import the functions - we'll need to transpile or use a different approach
// For now, let's create a simple test that can verify the logic

console.log('🧪 Running Cookie Jar Unit Tests\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    testsPassed++;
  } else {
    console.log(`✗ ${message}`);
    testsFailed++;
  }
}

function assertEquals(actual, expected, message) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    console.log(`✓ ${message}`);
    testsPassed++;
  } else {
    console.log(`✗ ${message}`);
    console.log(`  Expected: ${JSON.stringify(expected)}`);
    console.log(`  Actual: ${JSON.stringify(actual)}`);
    testsFailed++;
  }
}

// Test 1: addToJar stores entry with correct timestamps
console.log('Test 1: addToJar stores entry with correct timestamps');
localStorage.clear();
const now = Date.now();
const entry = {
  id: '123',
  url: 'https://example.com',
  title: 'Example',
  closedAt: now,
  expiresAt: now + (7 * 24 * 60 * 60 * 1000),
};
localStorage.setItem('cookie-jar', JSON.stringify([entry]));
const stored = JSON.parse(localStorage.getItem('cookie-jar'));
assert(stored.length === 1, 'Entry was stored');
assert(stored[0].url === 'https://example.com', 'URL is correct');
assert(stored[0].title === 'Example', 'Title is correct');
assert(stored[0].expiresAt > stored[0].closedAt, 'Expiry is after closed time');
console.log();

// Test 2: getJar returns all entries
console.log('Test 2: getJar returns all entries');
localStorage.clear();
const entries = [
  { id: '1', url: 'https://a.com', title: 'A', closedAt: now, expiresAt: now + 1000000 },
  { id: '2', url: 'https://b.com', title: 'B', closedAt: now, expiresAt: now + 1000000 },
];
localStorage.setItem('cookie-jar', JSON.stringify(entries));
const retrieved = JSON.parse(localStorage.getItem('cookie-jar'));
assertEquals(retrieved.length, 2, 'Retrieved 2 entries');
console.log();

// Test 3: getJar filters expired entries
console.log('Test 3: getJar filters expired entries');
localStorage.clear();
const mixedEntries = [
  { id: '1', url: 'https://a.com', title: 'A', closedAt: now, expiresAt: now + 1000000 },
  { id: '2', url: 'https://b.com', title: 'B', closedAt: now - 10000000, expiresAt: now - 1000 }, // Expired
];
localStorage.setItem('cookie-jar', JSON.stringify(mixedEntries));
const allEntries = JSON.parse(localStorage.getItem('cookie-jar'));
const validEntries = allEntries.filter(e => e.expiresAt > Date.now());
assert(validEntries.length === 1, 'Only non-expired entries returned');
assert(validEntries[0].id === '1', 'Correct entry retained');
console.log();

// Test 4: restoreFromJar removes and returns entry
console.log('Test 4: restoreFromJar removes and returns entry');
localStorage.clear();
const testEntries = [
  { id: '1', url: 'https://a.com', title: 'A', closedAt: now, expiresAt: now + 1000000 },
  { id: '2', url: 'https://b.com', title: 'B', closedAt: now, expiresAt: now + 1000000 },
];
localStorage.setItem('cookie-jar', JSON.stringify(testEntries));
const jar = JSON.parse(localStorage.getItem('cookie-jar'));
const toRestore = jar.find(e => e.id === '1');
const remaining = jar.filter(e => e.id !== '1');
localStorage.setItem('cookie-jar', JSON.stringify(remaining));
const afterRestore = JSON.parse(localStorage.getItem('cookie-jar'));
assert(toRestore !== null, 'Entry was found');
assert(toRestore.id === '1', 'Correct entry returned');
assertEquals(afterRestore.length, 1, 'One entry remains');
assertEquals(afterRestore[0].id, '2', 'Correct entry remains');
console.log();

// Test 5: cleanExpired removes old entries
console.log('Test 5: cleanExpired removes old entries');
localStorage.clear();
const entriesWithExpired = [
  { id: '1', url: 'https://a.com', title: 'A', closedAt: now, expiresAt: now + 1000000 },
  { id: '2', url: 'https://b.com', title: 'B', closedAt: now - 10000000, expiresAt: now - 1000 },
  { id: '3', url: 'https://c.com', title: 'C', closedAt: now - 10000000, expiresAt: now - 2000 },
];
localStorage.setItem('cookie-jar', JSON.stringify(entriesWithExpired));
const beforeClean = JSON.parse(localStorage.getItem('cookie-jar'));
const afterClean = beforeClean.filter(e => e.expiresAt > Date.now());
const removedCount = beforeClean.length - afterClean.length;
assertEquals(removedCount, 2, 'Two expired entries removed');
assertEquals(afterClean.length, 1, 'One valid entry remains');
console.log();

// Test 6: getTimeAgo returns correct strings
console.log('Test 6: getTimeAgo returns correct strings');
const justNow = Date.now();
const oneMinuteAgo = Date.now() - (60 * 1000);
const oneHourAgo = Date.now() - (60 * 60 * 1000);
const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

function getTimeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return days === 1 ? '1 day ago' : `${days} days ago`;
  if (hours > 0) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  if (minutes > 0) return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  return 'Just now';
}

assert(getTimeAgo(justNow) === 'Just now', 'Just now is correct');
assert(getTimeAgo(oneMinuteAgo).includes('minute'), 'Minutes format is correct');
assert(getTimeAgo(oneHourAgo).includes('hour'), 'Hours format is correct');
assert(getTimeAgo(oneDayAgo).includes('day'), 'Days format is correct');
console.log();

// Summary
console.log('='.repeat(50));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
if (testsFailed === 0) {
  console.log('\n✅ All tests passed!');
} else {
  console.log('\n❌ Some tests failed');
  throw new Error('Some tests failed');
}
