var express = require('express')
var router = express.Router();
const moment = require('moment')
const ObjectID = require('mongodb').ObjectId


router.get('/', async function (req, res, next) {
    try {
        const params = [];
        let sortby = req.query.sortby || 'number';
        let sortorder = req.query.sortorder || 'asc'
        
        if (req.query.checkId && req.query.id) {
            params.push({ number: parseInt(req.query.id) });
        }
        if (req.query.checkStr && req.query.string) {
            params.push({ string: { $regex: req.query.string, $options: 'i' } });
        }
        if (req.query.checkInt && req.query.integer) {
            params.push({ integer: parseInt(req.query.integer) });
        }
        if (req.query.checkFloat && req.query.float) {
            params.push({ float: parseFloat(req.query.float) });
        }
        if (req.query.checkDate && req.query.startDate && req.query.endDate) {
            params.push({
                date: {
                    $gte: req.query.startDate,
                    $lte: req.query.endDate
                }
            });
        }
        if (req.query.checkBol && req.query.boolean) {
            // Check if the boolean value is "true" or "false"
            if (req.query.boolean === 'true') {
                params.push({ boolean: true });
            } else if (req.query.boolean === 'false') {
                params.push({ boolean: false });
            }
        }

        const db = req.app.locals.db;
        const collection = db.collection('data');
        let query = collection.find(params.length > 0 ? { $and: params } : {});

        const page = parseInt(req.query.page) || 1;
        const limit = 3;
        const offset = (page - 1) * limit;
        query = query.sort({ [sortby]: sortorder }).limit(limit).skip(offset);
        const total = await collection.countDocuments(params.length > 0 ? { $and: params } : {});
        const pages = Math.ceil(total / limit);

        const queryParams = new URLSearchParams(req.query);
        queryParams.delete('sortby');
        queryParams.delete('sortorder');
        queryParams.set('page', '1'); // Remove the 'page' parameter from the query parameters
        const url = `${req.path}?${queryParams.toString()}`;

        const data = await query.toArray();

        const processData = [];
        data.forEach(item => {
            const formattedDate = moment(new Date(item.date)).format('YYYY-MMMM-DD');
            processData.push({ ...item, date: formattedDate });
        });

        res.json({
            data: processData,
            page: page,
            pages: pages,
            url: url,
            query: req.query,
            sortby,
            sortorder
        });
    } catch (err) {
        console.error(err);
        // Handle error response
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { number, string, integer, float, date } = req.body
        const db = req.app.locals.db;
        const collection = db.collection('data');
        const result = await collection.updateMany({ _id: new ObjectID(id) }, {
            $set: { number: parseInt(number), string: string, integer: parseInt(integer), float: parseFloat(float), date: date }
        });
        res.json(result)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Error Updating data" })
    }
})

router.post('/', async (req, res) => {
    try {
        const { number, string, integer, float, date, boolean } = req.body
        if (!number) {
            res.status(400).json({ error: "Value are required" })
            // alert('Input data')
        }
        const db = req.app.locals.db;
        const collection = db.collection('data');
        const result = await collection.insertOne({
            number: parseInt(number),
            string: string,
            integer: parseInt(integer),
            float: parseFloat(float),
            date: date,
            boolean: boolean === 'true'
        })
        res.json(result)
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error Creating data" })
    }
});


router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const db = req.app.locals.db;
        const collection = db.collection('data');
        const result = await collection.deleteOne({ _id: new ObjectID(id) });
        console.log(result)
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error Deleting the data" });
    }
});
module.exports = router;