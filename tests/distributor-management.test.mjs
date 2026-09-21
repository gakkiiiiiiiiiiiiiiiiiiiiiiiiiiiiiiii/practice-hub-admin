import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'vitest';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (relativePath) => fs.readFileSync(path.join(dirname, '..', relativePath), 'utf8');
const routerSource = read('src/router/index.ts');
const layoutSource = read('src/layouts/BasicLayout.vue');
const listSource = read('src/views/distributor/components/DistributorList.vue');
const configSource = read('src/views/distributor/components/DistributionConfig.vue');

test('agent management exposes independent admin routes and menu entries', () => {
	assert.match(routerSource, /path: ["']distributor\/list["']/);
	assert.match(routerSource, /path: ["']distributor\/config["']/);
	assert.match(layoutSource, /label: ["']代理商管理["']/);
	assert.match(layoutSource, /label: ["']代理商列表["']/);
	assert.match(layoutSource, /label: ["']代理配置["']/);
});

test('agent list shows user, commission, subordinate and sales fields', () => {
	assert.match(listSource, /user_avatar/);
	assert.match(listSource, /base_commission_rate/);
	assert.match(listSource, /direct_team_commission_rate/);
	assert.match(listSource, /indirect_team_commission_rate/);
	assert.match(listSource, /subordinate_count/);
	assert.match(listSource, /sales_amount/);
});

test('agent config supports poster upload and three commission rate groups', () => {
	assert.match(configSource, /promotion_poster_url/);
	assert.match(configSource, /handlePosterUpload/);
	assert.match(configSource, /base_commission_rates/);
	assert.match(configSource, /direct_commission_rates/);
	assert.match(configSource, /indirect_commission_rates/);
});
