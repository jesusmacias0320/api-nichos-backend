const express = require('express');
const router = express.Router();
const nicheController = require('../controllers/nicheController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, nicheController.getAllNiches);

router.get('/my-niches', verifyToken, nicheController.getMyNiches);

router.get('/history', verifyToken, isAdmin, nicheController.getTransferHistory);

router.post('/', verifyToken,isAdmin,nicheController.createNiche);

router.put('/:id/transfer', verifyToken, isAdmin, nicheController.transferNiche);

router.put('/:id/release', nicheController.releaseNiche);


module.exports = router;