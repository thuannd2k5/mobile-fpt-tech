const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function staffModule(client = {}) {
    const filename = path.resolve(__dirname, '../src/api/staff.ts');
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    const loaded = new Module(filename, module);
    loaded.require = id => {
        if (id === './axios-customize') return { __esModule: true, default: client };
        return Module.prototype.require.call(loaded, id);
    };
    loaded._compile(compiled.outputText, filename);
    return loaded.exports;
}
const input = { day_of_week: 'Monday', start_time: '08:00', end_time: '10:00', status: 'available' };

test('teacher availability rejects invalid and reversed times before submitting', () => {
    const { scheduleValidation } = staffModule();
    for (const [start_time, end_time] of [['8:00', '10:00'], ['24:00', '25:00'], ['08:60', '10:00'], ['10:00', '08:00'], ['08:00', '08:00']]) {
        assert.notEqual(scheduleValidation({ ...input, start_time, end_time }, []), '');
    }
    assert.equal(scheduleValidation(input, []), '');
});

test('availability overlap validation allows adjacent slots, different days, and editing itself', () => {
    const { scheduleValidation } = staffModule();
    const slot = { ...input, _id: 'mine' };
    assert.notEqual(scheduleValidation({ ...input, start_time: '09:00', end_time: '11:00' }, [slot]), '');
    assert.notEqual(scheduleValidation({ ...input, status: 'busy' }, [slot]), '');
    assert.equal(scheduleValidation({ ...input, start_time: '10:00', end_time: '11:00' }, [slot]), '');
    assert.equal(scheduleValidation({ ...input, day_of_week: 'Tuesday' }, [slot]), '');
    assert.equal(scheduleValidation(input, [slot], 'mine'), '');
});

test('teacher schedule APIs use authenticated own endpoint and PATCH includes required body id', async () => {
    const calls = [];
    const client = Object.fromEntries(['get', 'post', 'patch', 'delete'].map(method => [method, (...args) => { calls.push([method, ...args]); return Promise.resolve({ data: [] }); }]));
    const api = staffModule(client);
    await api.fetchOwnSchedules();
    await api.createOwnSchedule(input);
    await api.updateOwnSchedule('own-slot', input);
    await api.deleteOwnSchedule('own-slot');
    assert.deepEqual(calls, [
        ['get', '/schedules/me'],
        ['post', '/schedules', input],
        ['patch', '/schedules/own-slot', { ...input, _id: 'own-slot' }],
        ['delete', '/schedules/own-slot'],
    ]);
    assert.equal('teacher_id' in calls[1][2], false);
});

test('staff mutation responses reject missing payloads, errors, and not-found strings', () => {
    const { requireStaffResponse } = staffModule();
    for (const response of [{ statusCode: 400, data: {} }, { statusCode: 200 }, { statusCode: 200, data: null }, { statusCode: 200, data: 'not found schedule' }, { statusCode: 200, error: 'forbidden', data: {} }]) {
        assert.throws(() => requireStaffResponse(response));
    }
    assert.equal(requireStaffResponse({ statusCode: 200, data: [] }).statusCode, 200);
});
