const express = require('express');
const router = express.Router();
const db = require('../db');
const ExpressError = require('../expressError');




router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(
            `SELECT id,comp_code FROM invoices`
        );
        res.send({ invoices: results.rows })

    } catch (e) {
        return next(e)
    }
})

router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const results = await db.query(
            `SELECT * FROM invoices WHERE id=$1`, [id]
        );
        if (results.rows.length === 0) {
            throw new ExpressError(`Invoice of id ${id} not found `, 404)
        };
        const companyCode = results.rows[0].comp_code;
        const company = await db.query(
            `SELECT * FROM companies WHERE code=$1`, [companyCode]
        );
        res.send({
            invoice: results.rows[0],
            company: company.rows[0]
        })
    } catch (e) {
        return next(e)
    }
})



router.post('/', async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body;
        if (!comp_code || !amt) {
            throw new ExpressError('Require comp_code and amt to generate new invoice', 400)
        };

        const results = await db.query(
            `INSERT INTO invoices (comp_code, amt) VALUES ($1,$2) RETURNING *`, [comp_code, amt]
        );

        res.status(201).send({ invoice: results.rows[0] })
    } catch (e) {
        return next(e)
    }


})



router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amt } = req.body;
        let { paid } = req.body;

        if (paid == 'true') {
            let paid = true;
            const result = await db.query(
                `UPDATE invoices SET amt=$1, paid_date=now() WHERE id=$2 RETURNING *`, [amt, id]
            )
            if (result.rows.length === 0) {
                throw new ExpressError(`Invoice with id of ${id} not found`, 400)
            }
            return res.send({ invoice: result.rows[0] })
        }
        if (paid == 'false') {
            let paid = false;
            const result = await db.query(
                `UPDATE invoices SET amt=$1, paid_date=NULL WHERE id=$2 RETURNING *`, [amt, id]
            )

            if (result.rows.length === 0) {
                throw new ExpressError(`Invoice with id of ${id} not found`, 400)
            }
            return res.send({ invoice: result.rows[0] })
        }
        else {
            const result = await db.query(
                `UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING *`, [amt, id]
            )
            if (result.rows.length === 0) {
                throw new ExpressError(`Invoice with id of ${id} not found`, 400)
            }
            return res.send({ invoice: result.rows[0] })
        };

    } catch (e) {
        return next(e)
    }

})



router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            `DELETE FROM invoices WHERE id=$1`, [id]
        );

        if (result.rowCount !== 1) {
            throw new ExpressError(`Invoice with id of ${id} does not exist`, 400)
        };
        res.send({ message: ` Invoice id of ${id} has been deleted` })

    } catch (e) {
        return next(e)
    }

})

module.exports = router