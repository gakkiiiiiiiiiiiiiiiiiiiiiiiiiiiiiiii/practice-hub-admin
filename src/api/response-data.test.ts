import { describe, expect, it } from 'vitest';
import { responseData } from './response-data';

describe('responseData', () => {
	it('unwraps the common backend response envelope', () => {
		expect(responseData({ code: 200, msg: 'ok', data: { enabled: true } }, {})).toEqual({ enabled: true });
	});

	it('keeps raw compatibility responses and applies a null fallback', () => {
		expect(responseData([1, 2], [])).toEqual([1, 2]);
		expect(responseData(null, [])).toEqual([]);
	});
});
