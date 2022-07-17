/** BizTime express application. */
const express = require("express");
const app = express();
const ExpressError = require("./expressError")

app.use(express.json());

const companiesRoutes = require('./routes/companies');
const invoicesRoutes = require('./routes/invoices');
const industriesRoutes = require('./routes/industries')


// use the routes/companies file
app.use("/companies", companiesRoutes);
// use the routes/invoices file
app.use("/invoices", invoicesRoutes);

app.use("/industries", industriesRoutes);

/** 404 handler */

app.use(function (req, res, next) {
    const err = new ExpressError("Not Found", 404);
    return next(err);
});

/** general error handler */

app.use((err, req, res, next) => {
    res.status(err.status || 500);

    return res.json({
        error: err
    });
});


module.exports = app;
