import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import App from '@/App.vue';

vi.stubGlobal(
  'fetch',
  vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    }),
  ),
);

describe('App.vue', () => {
  it('renders correctly', () => {
    const wrapper = mount(App);
    expect(wrapper.exists()).toBe(true);
  });
});
