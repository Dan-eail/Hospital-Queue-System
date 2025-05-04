const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ success: true, data: [], message: 'Route placeholder' });
});

module.exports = router;
