import { describe, it, expect, vi } from 'vitest';
import { EventBus, appBus } from './EventBus.js';

describe('EventBus', () => {
  it('on/emit fires registered listeners', () => {
    const bus = new EventBus();
    const cb = vi.fn();
    bus.on('greet', cb);
    bus.emit('greet', 'hi');
    expect(cb).toHaveBeenCalledWith('hi');
  });

  it('on returns an unsubscribe function', () => {
    const bus = new EventBus();
    const cb = vi.fn();
    const off = bus.on('x', cb);
    off();
    bus.emit('x', 1);
    expect(cb).not.toHaveBeenCalled();
  });

  it('listenerCount tracks active subscribers', () => {
    const bus = new EventBus();
    bus.on('e', () => {});
    bus.on('e', () => {});
    expect(bus.listenerCount('e')).toBe(2);
    expect(bus.listenerCount('other')).toBe(0);
  });

  it('emit swallows listener exceptions and still notifies subsequent listeners', () => {
    const bus = new EventBus();
    const good = vi.fn();
    bus.on('x', () => { throw new Error('first listener boom'); });
    bus.on('x', good);
    // The throw should be caught; the good listener still runs.
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    bus.emit('x', 42);
    expect(good).toHaveBeenCalledWith(42);
    err.mockRestore();
  });

  it('clear() removes all listeners and clear(event) removes one event', () => {
    const bus = new EventBus();
    bus.on('a', () => {});
    bus.on('b', () => {});
    bus.clear('a');
    expect(bus.listenerCount('a')).toBe(0);
    expect(bus.listenerCount('b')).toBe(1);
    bus.clear();
    expect(bus.listenerCount('b')).toBe(0);
  });

  it('on returns a no-op when cb is not a function', () => {
    const bus = new EventBus();
    const off = bus.on('x', 'not-a-fn');
    expect(typeof off).toBe('function');
    expect(() => off()).not.toThrow();
  });

  it('appBus is a singleton EventBus instance', () => {
    expect(appBus).toBeInstanceOf(EventBus);
  });
});
