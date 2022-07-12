const express = require('express');
const { route } = require('../app');
const router = new express.Router();
const db = require('../db')

const ExpressError = require('../expressError')


router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(
            'SELECT code, name FROM companies'
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
            'SELECT * FROM companies WHERE code=$1', [code]
        );

        if (result.rows.length === 0) {
            throw new ExpressError(`company code of '${code}' not found`, 404)
        };

        return res.send({ company: result.rows[0] })
    } catch (e) {
        return next(e)
    }
})



router.post('/', async (req, res, next) => {
    try {
        const { code, name, description } = req.body;

        if (!code || !name || !description) {
            throw new ExpressError("Invalid format, require code, name and description", 400)
        };
        const result = await db.query(
            `INSERT INTO companies VALUES ($1,$2,$3)
            RETURNING *`, [code, name, description]
        );

        res.send({ company: result.rows[0] })
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



router.get('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const result = db.query(
            `SELECT * FROM companies WHERE code=$1`, [code]
        );
        if (result.rows.length === 0) {
            throw new ExpressError(`Company code ${code} not found`, 404)
        }
        res.send({ company: result.rows[0] })
    } catch (e) {
        return next(e)
    }

})






module.exports = router;