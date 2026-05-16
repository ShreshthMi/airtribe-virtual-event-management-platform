const { validateEventPayload } = require('../src/utils/validators');

describe('validateEventPayload', () => {
  test.each([
    [{}, 'title is required'],
    [{ title: 'x', date: '20-08-2030', time: '18:30' }, 'date must be in YYYY-MM-DD format'],
    [{ title: 'x', date: '2030/08/15', time: '18:30' }, 'date must be in YYYY-MM-DD format'],
    [{ title: 'x', date: '2030-08-15', time: 'nope' }, 'time must be in HH:MM format'],
    [{ title: 'x', date: '2030-08-15', time: '18:30', description: 123 }, 'description must be a string'],
  ])('case %#: %p reports %p', (body, expectedSubstring) => {
    const errors = validateEventPayload(body);
    expect(errors.join('; ')).toContain(expectedSubstring);
  });

  // The current regex only checks shape, not validity — '99:99' satisfies \d{2}:\d{2}.
  // Documenting the existing behaviour so a future tightening of the regex doesn't pass silently.
  test('time regex accepts shape-valid but semantically-invalid values like "99:99"', () => {
    expect(validateEventPayload({ title: 'x', date: '2030-08-15', time: '99:99' })).toEqual([]);
  });

  test('partial mode skips missing optionals but still rejects an explicit empty title', () => {
    expect(validateEventPayload({ title: 'New' }, { partial: true })).toEqual([]);
    expect(validateEventPayload({ title: '' }, { partial: true })).toContain('title is required');
  });

  test('capacity must be a positive integer when provided; null and undefined are accepted', () => {
    const base = { title: 'x', date: '2030-08-15', time: '18:30' };
    expect(validateEventPayload({ ...base, capacity: 0 })).toContain('capacity must be a positive integer');
    expect(validateEventPayload({ ...base, capacity: -1 })).toContain('capacity must be a positive integer');
    expect(validateEventPayload({ ...base, capacity: 1.5 })).toContain('capacity must be a positive integer');
    expect(validateEventPayload({ ...base, capacity: '10' })).toContain('capacity must be a positive integer');
    expect(validateEventPayload({ ...base, capacity: 100 })).toEqual([]);
    expect(validateEventPayload({ ...base, capacity: null })).toEqual([]);
    expect(validateEventPayload(base)).toEqual([]);
  });
});
