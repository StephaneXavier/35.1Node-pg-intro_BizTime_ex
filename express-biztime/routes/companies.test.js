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


describe("GET /companies", () => {
    test('get list of companies', async () => {
        const res = await request(app).get('/companies');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            companies: [{ code: testCompany.code, name: testCompany.name },
            { code: testCompany2.code, name: testCompany2.name }]
        })
    })
})

describe("GET /companies/:code", () => {
    test('get particular company', async () => {
        const res = await request(app).get('/companies/mc');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ company: testCompany });
    });
    test('error message when company code does not exist', async () => {
        const res = await request(app).get('/companies/0');
        expect(res.statusCode).toBe(404);
    })
})

describe("POST /companies", () => {
    test("add a new company succesfully", async () => {
        const resp = await request(app).post('/companies').send(
            { code: "ts", name: "Tesla", description: "electric cars" }
        );
        const allData = await request(app).get('/companies')
        expect(resp.statusCode).toBe(201);
        expect(allData.body.companies.length).toBe(3);

    })
    test("throw error when missing data", async () => {
        const resp = await (request(app).post('/companies')).send(
            { code: "Bad post" }
        );
        expect(resp.statusCode).toBe(400);
    })
})

describe("PUT /companies", () => {
    test("update company succesfully", async () => {
        const resp = await request(app).put('/companies/mc').send(
            { name: "Tesla", description: "electric cars" }
        );
        const compData = await request(app).get('/companies/mc')
        expect(resp.statusCode).toBe(200);
        expect(compData.body).toEqual({ company: { code: "mc", name: "Tesla", description: "electric cars" } });

    })
    test("throw error when missing data", async () => {
        const resp = await (request(app).put('/companies/mc')).send(
            { name: "Bad put" }
        );
        expect(resp.statusCode).toBe(400);
    })
})

describe("DELETE /companies/:code", () => {
    test("delete entry succesfully", async () => {
        const resp = await request(app).delete('/companies/mc')
        const mcData = await request(app).get('/companies/mc')
        expect(resp.statusCode).toBe(200);
        expect(mcData.body).toEqual({ error: { message: "company code of 'mc' not found", status: 404 } });
    })
})

