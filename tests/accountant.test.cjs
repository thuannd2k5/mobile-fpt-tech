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

test('finance totals include partial payments and exclude pending approval from revenue', () => {
    const { financeSummary } = load();
    const result = financeSummary([
        { amount: 100, final_amount: 100, status: 'PAID' },
        { amount: 200, final_amount: 180, paid_amount: 50, status: 'PARTIAL' },
        { amount: 80, status: 'UNPAID' },
        { amount: 70, status: 'WAITING_CONFIRMATION' },
        { amount: 90, status: 'CANCELLED' },
    ]);
    assert.deepEqual(result, {
        invoiced: 430,
        settled: 150,
        outstanding: 280,
        unpaidCount: 3,
        partialCount: 1,
        pendingCount: 1,
    });
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

test('recording a receipt delegates settlement and amount handling to the backend', async () => {
    const calls = [];
    const { createAccountantReceipt } = load({
        post: async (...args) => { calls.push(args); return { statusCode: 201, data: { _id: 'payment-id' } }; },
    });
    const payload = { invoice_id: 'invoice-id', amount: 2500000, payment_method: 'CASH', payment_date: '2026-11-26T00:00:00.000Z' };
    await createAccountantReceipt(payload);
    assert.deepEqual(calls, [['/payments', payload]]);
});

test('failed receipt creation is surfaced without creating a success-shaped response', async () => {
    const { createAccountantReceipt } = load({
        post: async () => { throw new Error('Invoice update failed'); },
    });
    await assert.rejects(
        createAccountantReceipt({
            invoice_id: 'invoice-id',
            amount: 1250000,
            payment_method: 'CASH',
            payment_date: '2026-11-26T00:00:00.000Z',
        }),
        /Invoice update failed/,
    );
});

test('accounting updates include the identifier required by backend DTOs', async () => {
    const calls = [];
    const { updateAccountantInvoice, updateAccountantPayment } = load({ patch: async (...args) => { calls.push(args); return { statusCode: 200, data: {} }; } });
    await updateAccountantInvoice('invoice-id', { status: 'PAID' });
    await updateAccountantPayment('payment-id', { payment_method: 'CASH' });
    await updateAccountantPayment('payment-id', { status: 'APPROVED', approved_amount: 125 });
    assert.deepEqual(calls, [
        ['/invoices/invoice-id', { status: 'PAID', _id: 'invoice-id' }],
        ['/payments/payment-id', { payment_method: 'CASH', _id: 'payment-id' }],
        ['/payments/payment-id', { status: 'APPROVED', approved_amount: 125, _id: 'payment-id' }],
    ]);
});

test('monthly revenue counts only approved amounts for the selected year', () => {
    const { monthlyRevenue } = load();
    const revenue = monthlyRevenue([
        { amount: 200, status: 'APPROVED', payment_date: '2026-04-15T00:00:00.000Z' },
        { amount: 500, status: 'WAITING_CONFIRMATION', payment_date: '2026-04-20T00:00:00.000Z' },
        { approved_amount: 125, status: 'APPROVED', payment_date: '2025-04-20T00:00:00.000Z' },
    ], 2026);
    assert.equal(revenue[3], 200);
    assert.equal(revenue.reduce((sum, amount) => sum + amount, 0), 200);
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
