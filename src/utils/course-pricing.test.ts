import { describe, expect, it } from 'vitest';
import { isCourseFree } from './course-pricing';

describe('isCourseFree', () => {
	it('treats an explicitly free course as free', () => {
		expect(isCourseFree({ is_free: 1, price: 99 })).toBe(true);
	});

	it.each([0, '0', '0.00'])('treats a zero-priced course as free (%s)', (price) => {
		expect(isCourseFree({ is_free: 0, price })).toBe(true);
	});

	it('keeps a positive-priced course paid', () => {
		expect(isCourseFree({ is_free: 0, price: 5 })).toBe(false);
	});
});
