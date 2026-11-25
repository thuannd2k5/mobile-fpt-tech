const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function loadTs(relativePath, overrides = {}) {
    const filename = path.resolve(__dirname, '..', relativePath);
    const source = fs.readFileSync(filename, 'utf8');
    const compiled = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    const loaded = new Module(filename, module);
    loaded.filename = filename;
    loaded.paths = Module._nodeModulePaths(path.dirname(filename));
    loaded.require = (id) => Object.hasOwn(overrides, id) ? overrides[id] : Module.prototype.require.call(loaded, id);
    loaded._compile(compiled.outputText, filename);
    return loaded.exports;
}

test('backend UNPAID and legacy pending invoices are payable, settled and cancelled invoices are not', () => {
    const { isInvoicePayable } = loadTs('src/utils/invoices.ts');
    for (const status of ['UNPAID', 'PENDING', 'WAITING_PAYMENT', ' unpaid ']) {
        assert.equal(isInvoicePayable(status), true, status);
    }
    for (const status of ['PAID', 'COMPLETED', 'CANCELLED', undefined, '']) {
        assert.equal(isInvoicePayable(status), false, String(status));
    }
});

test('role routing preserves all existing portal destinations', () => {
    const { getDefaultRouteForRole } = loadTs('src/types/portal.ts');
    assert.equal(getDefaultRouteForRole('ADMIN'), '/admin');
    assert.equal(getDefaultRouteForRole('TEACHER'), '/(teacher)');
    assert.equal(getDefaultRouteForRole('CONSULTANT'), '/(consultant)');
    assert.equal(getDefaultRouteForRole('STUDENT'), '/(student)');
    assert.equal(getDefaultRouteForRole('MANAGER'), '/(student)');
    assert.equal(getDefaultRouteForRole('ACCOUNTANT'), '/(student)');
});

test('session expiry notifies subscribers and cleanup removes the subscription', () => {
    const { onSessionExpired, notifySessionExpired } = loadTs('src/utils/session.ts');
    let count = 0;
    const unsubscribe = onSessionExpired(() => { count++; });
    notifySessionExpired();
    assert.equal(count, 1);
    unsubscribe();
    notifySessionExpired();
    assert.equal(count, 1);
});

test('logout clears local credentials and resets the account even when the server is offline', async () => {
    const { logoutSession } = loadTs('src/utils/logout.ts');
    const events = [];
    await logoutSession({
        revoke: async () => { events.push('revoke'); throw new Error('offline'); },
        clear: async () => { events.push('clear'); },
        reset: () => { events.push('reset'); },
    });
    assert.deepEqual(events, ['revoke', 'clear', 'reset']);
});

test('logout waits for local credential removal before resetting the account', async () => {
    const { logoutSession } = loadTs('src/utils/logout.ts');
    let reset = false;
    await assert.rejects(logoutSession({
        revoke: async () => {},
        clear: async () => { throw new Error('storage unavailable'); },
        reset: () => { reset = true; },
    }), /storage unavailable/);
    assert.equal(reset, false);
});

function refreshHarness(payload = { access_token: 'new-token' }, rejectRetry = false) {
    let accessToken = 'old-token';
    let onError;
    let refreshCount = 0;
    let expiredCount = 0;
    let retryCount = 0;
    const client = {
        interceptors: { request: { use() {} }, response: { use(_success, error) { onError = error; } } },
        async request(config) {
            retryCount++;
            assert.equal(config.headers.Authorization, 'Bearer new-token');
            if (rejectRetry) return onError({ response: { status: 401, data: { message: 'Token rejected' } }, config });
            return { data: 'retried' };
        },
    };
    loadTs('src/api/axios-customize.ts', {
        axios: { __esModule: true, default: {
            create: () => client,
            async get() {
                refreshCount++;
                await Promise.resolve();
                return { data: { data: payload }, headers: {} };
            },
        } },
        '@/config/env': { BACKEND_URL: 'http://api.test/api/v1' },
        '@/utils/storage': {
            getAccessToken: async () => accessToken,
            setAccessToken: async (token) => { accessToken = token; },
            getRefreshToken: async () => 'refresh-token',
            setRefreshToken: async () => {},
            clearAuthStorage: async () => { accessToken = null; },
        },
        '@/utils/session': { notifySessionExpired: () => { expiredCount++; } },
    });
    const unauthorized = (url = '/invoices/me') => onError({
        response: { status: 401, data: { message: 'Unauthorized' } },
        config: { url, headers: { Authorization: 'Bearer old-token' } },
    });
    return { unauthorized, counts: () => ({ refreshCount, expiredCount, retryCount }) };
}

test('simultaneous expired API requests refresh once and both retry with the new token', async () => {
    const harness = refreshHarness();
    const results = await Promise.all([harness.unauthorized(), harness.unauthorized()]);
    assert.deepEqual(results, [{ data: 'retried' }, { data: 'retried' }]);
    assert.deepEqual(harness.counts(), { refreshCount: 1, expiredCount: 0, retryCount: 2 });
});

test('logout rejection does not start a token refresh before local sign-out', async () => {
    const harness = refreshHarness();
    await assert.rejects(harness.unauthorized('/auth/logout'));
    assert.deepEqual(harness.counts(), { refreshCount: 0, expiredCount: 0, retryCount: 0 });
});

test('refresh response without an access token rejects and expires the session', async () => {
    const harness = refreshHarness({});
    await assert.rejects(harness.unauthorized());
    assert.deepEqual(harness.counts(), { refreshCount: 1, expiredCount: 1, retryCount: 0 });
});

test('a retried 401 expires the session instead of leaving the user signed in', async () => {
    const harness = refreshHarness({ access_token: 'new-token' }, true);
    await assert.rejects(harness.unauthorized());
    assert.deepEqual(harness.counts(), { refreshCount: 1, expiredCount: 1, retryCount: 1 });
});

test('bank details are absent until all receiving details are configured', () => {
    const keys = ['BANK_ID', 'BANK_NAME', 'ACCOUNT_NUMBER', 'ACCOUNT_NAME'].map((key) => `EXPO_PUBLIC_PAYMENT_${key}`);
    const previous = keys.map((key) => process.env[key]);
    try {
        keys.forEach((key) => { delete process.env[key]; });
        assert.equal(loadTs('src/config/payment.ts').paymentBank, null);
        Object.assign(process.env, {
            EXPO_PUBLIC_PAYMENT_BANK_ID: '970000', EXPO_PUBLIC_PAYMENT_BANK_NAME: 'Test bank',
            EXPO_PUBLIC_PAYMENT_ACCOUNT_NUMBER: '000000', EXPO_PUBLIC_PAYMENT_ACCOUNT_NAME: 'Test & School',
        });
        const bank = loadTs('src/config/payment.ts').paymentBank;
        const url = new URL(bank.qrUrl(1200000, 'invoice12345678'));
        assert.equal(url.searchParams.get('amount'), '1200000');
        assert.equal(url.searchParams.get('accountName'), 'Test & School');
        assert.equal(url.searchParams.get('addInfo'), 'HOCPHI 12345678');
        delete process.env.EXPO_PUBLIC_PAYMENT_ACCOUNT_NAME;
        assert.equal(loadTs('src/config/payment.ts').paymentBank, null);
    } finally {
        keys.forEach((key, index) => {
            if (previous[index] === undefined) delete process.env[key];
            else process.env[key] = previous[index];
        });
    }
});
