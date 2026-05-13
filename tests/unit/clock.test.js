const clock = require('../../app/src/services/clock');

test('clock ticks', () => {
    const t1 = clock.tick();
    const t2 = clock.tick();
    expect(t2).toBeGreaterThan(t1);
});

test('clock updates correctly', () => {
    clock.t = 5;
    const t3 = clock.update(10);
    expect(t3).toBe(11);
    expect(clock.t).toBe(11);
});
