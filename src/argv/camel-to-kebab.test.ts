import { describe, it } from 'node:test';
import { strictEqual } from 'node:assert';

import { camelToKebab } from './camel-to-kebab.js';

describe('camelToKebab', () => {
    it('converts camelCase to kebab-case', () => {
        strictEqual(camelToKebab('saveDev'), 'save-dev');
    });

    it('leaves lowercase strings unchanged', () => {
        strictEqual(camelToKebab('config'), 'config');
    });

    it('handles multiple uppercase letters', () => {
        strictEqual(camelToKebab('saveDevDependencies'), 'save-dev-dependencies');
    });
});
