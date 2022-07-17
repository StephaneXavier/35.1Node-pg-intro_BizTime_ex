const express = require('express');
const router = new express.Router();
const db = require('../db')
const slugify = require('slugify')

const ExpressError = require('../expressError')


router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(
            `SELECT code,name 
            FROM companies;`
        );

        return res.send({ companies: results.rows })
    } catch (e) {
        return next(e)
    }
})



router.get('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const result = await db.query(
            `SELECT companies.code, companies.name, industry
             FROM companies 
             LEFT JOIN industries_companies ON companies.code=industries_companies.comp_code
             JOIN industries ON industries_companies.ind_code = industries.code
             WHERE companies.code=$1`, [code]
        );


        if (result.rows.length === 0) {
            throw new ExpressError(`company code of '${code}' not found`, 404)
        };

        let { name } = result.rows[0];
        const industry = result.rows.map(r => r.industry);

        return res.send({ company: { code, name, industry } })
    } catch (e) {
        return next(e)
    }
})



router.post('/', async (req, res, next) => {
    try {
        let { code, name, description } = req.body;

        if (!code || !name || !description) {
            throw new ExpressError("Invalid format, require code, name and description", 400)
        };

        code = slugify(code, { lower: true, strict: true });
        
        const result = await db.query(
            `INSERT INTO companies VALUES ($1,$2,$3)
            RETURNING *`, [code, name, description]
        );

        res.status(201).send({ company: result.rows[0] })
    } catch (e) {
        return next(e)
    }
})



router.put('/:code', async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const { code } = req.params;

        if (!name || !description) {
            throw new ExpressError('Please provide updated name AND description', 400)
        };
        const result = await db.query(
            `UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING *`, [name, description, code]
        );
        if (result.rows.length === 0) {
            throw new ExpressError(`Company code "${code}"does not exist`, 404)
        };

        res.send({ company: result.rows[0] })
    } catch (e) {
        return next(e)
    }
})



router.delete('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const result = await db.query(
            `DELETE FROM companies WHERE code=$1`, [code]
        );
        if (result.rowCount === 0) {
            throw new ExpressError(`Company code "${code}" does not exist`, 400)
        };

        res.send({ message: `'${code}' has been deleted` })
    } catch (e) {
        return next(e)
    }

})






module.exports = router;