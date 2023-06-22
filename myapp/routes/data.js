var express = require('express');
var router = express.Router();
const moment = require('moment');
const ObjectID = require('mongodb').ObjectId;

router.get('/', async function (req, res, next) {
    try {
        const params = {};
        let sortby = req.query.sortby || 'number';
        let sortorder = req.query.sortorder || 'asc';

        if (req.query.checkId && req.query.id) {
            params.number = parseInt(req.query.id);
        }
        if (req.query.checkStr && req.query.string) {
            params.string = { $regex: req.query.string, $options: 'i' };
        }
        if (req.query.checkInt && req.query.integer) {
            params.integer = parseInt(req.query.integer);
        }
        if (req.query.checkFloat && req.query.float) {
            params.float = parseFloat(req.query.float);
        }
        if (req.query.checkDate && req.query.startDate && req.query.endDate) {
            params.date = {
                $gte: req.query.startDate,
                $lte: req.query.endDate
            };
        }
        if (req.query.checkBol && req.query.boolean) {
            // Check if the boolean value is "true" or "false"
            params.boolean = (req.query.boolean === 'true');
        }

        const db = req.app.locals.db;
        const collection = db.collection('data');
        let query = collection.find(params);
        const page = parseInt(req.query.page) || 1;
        const limit = 3;
        const offset = (page - 1) * limit;
        query = query.sort({ [sortby]: sortorder }).limit(limit).skip(offset);
        const total = await collection.countDocuments(params);
        const pages = Math.ceil(total / limit);

        const queryParams = new URLSearchParams(req.query);
        queryParams.delete('sortby');
        queryParams.delete('sortorder');
        queryParams.set('page', '1');
        const url = `${req.path}?${queryParams.toString()}`;

        const data = await query.toArray();

        const processData = data.map(item => {
            const formattedDate = moment(item.date).format('YYYY-MMMM-DD');
            return { ...item, date: formattedDate };
        });

        res.status(200).json({
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
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/edit/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const db = req.app.locals.db;
        const collection = db.collection('data');
        const data = await collection.find({ _id: new ObjectID(id) }).toArray();
        const processData = data.map(item => {
            const formattedDate = moment(item.date).format('YYYY-MMMM-DD');
            return { ...item, date: formattedDate };
        });
        res.json(processData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error Retrieving Data' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { number, string, integer, float, date } = req.body;
        const db = req.app.locals.db;
        const collection = db.collection('data');
        const result = await collection.updateMany({ _id: new ObjectID(id) }, {
            $set: {
                number: parseInt(number),
                string: string,
                integer: parseInt(integer),
                float: parseFloat(float),
                date: date
            }
        });
        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error Updating Data' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { number, string, integer, float, date, boolean } = req.body;
        if (!number) {
            res.status(400).json({ error: 'Value is required' });
        } else {
            const db = req.app.locals.db;
            const collection = db.collection('data');
            const result = await collection.insertOne({
                number: parseInt(number),
                string: string,
                integer: parseInt(integer),
                float: parseFloat(float),
                date: date,
                boolean: boolean === 'true'
            });
            res.status(200).json(result);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error Creating Data' });
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const db = req.app.locals.db;
        const collection = db.collection('data');
        const result = await collection.deleteOne({ _id: new ObjectID(id) });
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error Deleting Data' });
    }
});

module.exports = router;
