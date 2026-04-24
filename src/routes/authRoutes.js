const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

//Ruta para registrar un usuario
router.post('/register',authController.register);

//Ruta para iniciar sesion
router.post('/login', authController.login);

//Ruta para obtener la lista de usuarios
router.get('/users', authController.getUsers);

module.exports = router;