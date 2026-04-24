const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');

//Importar rutas
const authRoutes = require('./routes/authRoutes');
const nicheRoutes = require('./routes/nicheRoutes');

const app = express();


//Middlewares globales
app.use(cors()); 
app.use(express.json());

//Usar las rutas
app.use('/api/auth', authRoutes);
app.use('/api/niches',nicheRoutes);

//Ruta de prueba 

app.get('/', (req, res) => {
    res.send('API de Administración de Nichos funcionando correctamente');
});

//Servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>{
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});