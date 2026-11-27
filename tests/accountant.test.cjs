const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function load(client = {}) {
    const filename = path.resolve(__dirname, '../src/api/accountant.ts');
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    const loaded = new Module(filename, module);
    loaded.filename = filename;
    loaded.paths = Module._nodeModulePaths(path.dirname(filename));
    loaded.require = (id) => id === './axios-customize' ? { __esModule: true, default: client } : Module.prototype.require.call(loaded, id);
    loaded._compile(compiled.outputText, filename);
    return loaded.exports;
}

test('finance amounts retain a zero final amount and only count paid status as settled', () => {
    const { financeSummary } = load();
    const result = financeSummary([
        { amount: 100, final_amount: 0, status: 'PAID' },
        { amount: 200, final_amount: 150, status: 'PAID' },
        { amount: 80, status: 'UNPAID' },
        { amount: 70, status: 'WAITING_CONFIRMATION' },
        { amount: 90, status: 'CANCELLED' },
    ]);
    assert.deepEqual(result, { invoiced: 300, settled: 150, outstanding: 150, unpaidCount: 2 });
});

test('accounting lists follow every server page instead of truncating totals', async () => {
    const calls = [];
    const { fetchAccountantInvoices } = load({ get: async (url) => {
        calls.push(url);
        const page = new URLSearchParams(url.split('?')[1]).get('current');
        return { data: { meta: { pages: 2 }, result: [{ _id: page }] } };
    } });
    assert.deepEqual((await fetchAccountantInvoices()).map((item) => item._id), ['1', '2']);
    assert.equal(calls.length, 2);
});

test('receipt creation sends only receipt data and does not change invoice status', async () => {
    const calls = [];
    const { createAccountantPayment } = load({ post: async (...args) => { calls.push(args); return { statusCode: 201, data: {} }; } });
    const payload = { invoice_id: 'invoice-id', payment_method: 'CASH', payment_date: '2026-11-26T00:00:00.000Z' };
    await createAccountantPayment(payload);
    assert.deepEqual(calls, [['/payments', payload]]);
});

test('accounting updates include the identifier required by backend DTOs', async () => {
    const calls = [];
    const { updateAccountantInvoice, updateAccountantPayment } = load({ patch: async (...args) => { calls.push(args); return { statusCode: 200, data: {} }; } });
    await updateAccountantInvoice('invoice-id', { status: 'PAID' });
    await updateAccountantPayment('payment-id', { payment_method: 'CASH' });
    assert.deepEqual(calls, [
        ['/invoices/invoice-id', { status: 'PAID', _id: 'invoice-id' }],
        ['/payments/payment-id', { payment_method: 'CASH', _id: 'payment-id' }],
    ]);
});

test('failed accounting envelopes never resolve as saved financial documents', async () => {
    for (const response of [{ statusCode: 400, message: 'Invalid invoice', data: {} }, { statusCode: 200, message: 'Missing data' }]) {
        const api = load({ post: async () => response, patch: async () => response, delete: async () => response });
        await assert.rejects(api.createAccountantInvoice({}));
        await assert.rejects(api.updateAccountantPayment('payment-id', {}));
        await assert.rejects(api.deleteAccountantInvoice('invoice-id'));
    }
});

test('invoice creation only offers enrollments without an existing invoice', () => {
    const { uninvoicedEnrollments } = load();
    const enrollments = [{ _id: 'first' }, { _id: 'second' }, { _id: 'third' }];
    const invoices = [{ enrollment_id: 'first' }, { enrollment_id: { _id: 'second' }, status: 'CANCELLED' }];
    assert.deepEqual(uninvoicedEnrollments(enrollments, invoices).map(e => e._id), ['third']);
});
