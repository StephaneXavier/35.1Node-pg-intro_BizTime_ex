const e = require('express');
const express = require('express');
const router = express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

router.post('/', async (req, res, next) => {
    try {
        const { code, industry } = req.body;

        if (!code || !industry) {
            throw new ExpressError("Invalid format, require code, industry", 400)
        };
        const results = await db.query(
            `INSERT INTO industries VALUES($1,$2) RETURNING *;`, [code, industry]
        );

        return res.send({ companies: results.rows })
    } catch (e) {
        return next(e)
    }
});


// Option #1 for GET /industries
router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(
            `SELECT * 
            FROM industries;`
        );
        const response = results.rows;

        const r3 = await Promise.all(response.map(elem => db.query(`SELECT companies.name 
        FROM companies 
        JOIN industries_companies ON (companies.code=comp_code) 
        WHERE ind_code='${elem.code}';`)
        )
        );
        // console.log('all associated company names sans related industries => ', r3.map(e => console.log(e.rows)))
        for (let i = 0; i < response.length; i++) {
            response[i].companies = r3[i].rows
        };
        // console.log('response after for loop => ',response)

        return res.send(response)
    } catch (e) {
        return next(e)
    }
})
// Option #2 for GET /industries
// router.get('/', async (req, res, next) => {
//     try {
//         const allIndustries = await db.query(
//             `SELECT * 
//             FROM industries;`
//         );

//         const response = allIndustries.rows

//         for (let i = 0; i < response.length; i++) {
//             let comp = await db.query(`SELECT companies.name 
//             FROM companies 
//             JOIN industries_companies ON (companies.code=comp_code) 
//             WHERE ind_code='${response[i].code}';`);
//             response[i].companies = comp.rows
//         }

//         console.log(response)

//         return res.send(response)
//     } catch (e) {
//         return next(e)
//     }
// })

router.post('/association', async (req, res, next) => {
    try {
        
        const { comp_code, ind_code } = req.body;
        if (!comp_code || !ind_code) {
            throw new ExpressError("Invalid format, require comp_code, ind_code", 400)
        };
        
        const comp = await db.query('SELECT * FROM companies WHERE code=$1', [comp_code]);
        const ind = await db.query('SELECT * FROM industries WHERE code=$1', [ind_code]);
        console.log(comp)
        console.log(comp.rows)
        if (comp.rows.length === 0) {
            throw new ExpressError(`comp_code '${comp_code}' does not exist`, 400)
        };
        
        if (ind.rows.length === 0) {
            throw new ExpressError(`ind_code '${ind_code}' does not exist`, 400)
        };
       
        const result = await db.query('INSERT INTO industries_companies (comp_code, ind_code) VALUES($1,$2) RETURNING *', [comp_code, ind_code])
        
        res.status(201).send({ message: `Association ${comp_code} to ${ind_code} succesfully added!` })

    } catch (e) {
        return next(e)
    }
})




module.exports = router