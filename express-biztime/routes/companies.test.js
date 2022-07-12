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
        const res = await request(app).get('/companies')
        expect(res.statusCode).toBe(200);
        console.log('res.body is =>', res.body)
        console.log('testCompany => ', testCompany)
        console.log('testCompany2 => ', testCompany2)
        
        expect(res.body).toEqual({ companies: [{code : testCompany.code, name: testCompany.name}, 
            {code : testCompany2.code, name: testCompany2.name}] })
    })
})

