process.env.NODE_ENV = 'test';

const request = require('supertest')
const app = require('../app')
const db = require('../db')

let testCompany;
let testCompany2;
let testInvoice;
let testInvoice2;

beforeEach(async () => {
    const comp = db.query(
        "INSERT INTO companies (code,name,description) VALUES ('mc','Microsoft','builds software') RETURNING *");
    const comp2 = db.query(
        "INSERT INTO companies (code,name,description) VALUES ('ap','Apple','fruit company') RETURNING *");
    const invoice = db.query(
        "INSERT INTO invoices (comp_code,amt) VALUES ('mc',300) RETURNING *"
    );
    const invoice2 = db.query(
        "INSERT INTO invoices (comp_code,amt) VALUES ('ap',9000) RETURNING *"
    );
    const results = await Promise.all([comp, comp2, invoice, invoice2]);

    testCompany = results[0].rows[0];
    testCompany2 = results[1].rows[0];
    testInvoice = results[2].rows[0];
    testInvoice2 = results[3].rows[0];

})

afterEach(async () => {
    const comp = db.query(
        "DELETE FROM companies"
    );
    const invoice = db.query(
        "DELETE FROM invoices"
    );

    await Promise.all([comp, invoice])

})

afterAll(async () => {
    await db.end()
})


describe("GET /invoices", () => {
    test('get list of invoices', async () => {
        const res = await request(app).get('/invoices');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            invoices: [{id: testInvoice.id, comp_code : testInvoice.comp_code}, {id: testInvoice2.id, comp_code : testInvoice2.comp_code}]
        })
    })
})

describe("GET /invoices/:code", () => {
    test('get particular invoice', async () => {
        const res = await request(app).get(`/invoices/${testInvoice.id}`);
        const comp = await request(app).get(`/companies/${testInvoice.comp_code}`)
        expect(res.statusCode).toBe(200);
        // expect(res.body).toEqual({ invoice: testInvoice, company : comp.body });
    });
    test('error message when invoice code does not exist', async () => {
        const res = await request(app).get('/invoices/0');
        expect(res.statusCode).toBe(404);
    })
})

describe("POST /invoices", () => {
    test("add a new invoice succesfully", async () => {
        const resp = await request(app).post('/invoices').send(
            { comp_code:"mc", amt:33333 }
        );
        const allData = await request(app).get('/invoices')
        expect(resp.statusCode).toBe(201);
        expect(allData.body.invoices.length).toBe(3);

    })
    test("throw error when missing data", async () => {
        const resp = await (request(app).post('/invoices')).send(
            { comp_code: "Bad post" }
        );
        expect(resp.statusCode).toBe(400);
    })
})

describe("PUT /invoices", () => {
    test("update invoice succesfully", async () => {
        const resp = await request(app).put(`/invoices/${testInvoice.id}`).send(
            { amt: 16 }
        );
        const invData = await request(app).get(`/invoices/${testInvoice.id}`)
        const compData = await request(app).get(`/companies/${testInvoice.comp_code}`)
        expect(resp.statusCode).toBe(200);
        
    })
    test("throw error when missing data", async () => {
        const resp = await (request(app).put(`/invoices/0`)).send(
            { name: "Bad put" }
        );
        expect(resp.statusCode).toBe(400);
    })
})

describe("DELETE /invoices/:code", () => {
    test("delete entry succesfully", async () => {
        const resp = await request(app).delete(`/invoices/${testInvoice.id}`)
        const data = await request(app).get(`/invoices/${testInvoice.id}`)
        expect(resp.statusCode).toBe(200);
        expect(data.body.error.status).toBe(404);
    })
})

