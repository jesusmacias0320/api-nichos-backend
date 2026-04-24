const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

//REGISTRO DE USUARIO

const register = async (req, res) =>{
    try{
        const{ email, password, role} =req.body;

        //Verificacion de correo existente
        const userExists = await db.query('SELECT * FROM users WHERE email =$1',[email]);
        if(userExists.rows.length > 0){
            return res.status(400).json({ error: 'El correo ya esta registrado'})
        }

        //Encryptar la constraseña
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        //Guardar Usuario
        const newUser = await db.query(
            'INSERT INTO users (email, password_hash, role) VALUES ($1,$2,$3) RETURNING id, email, role',
            [email, password_hash, role || 'client']
        );

        res.status(201).json({message: 'Usuario creado con éxito', user:newUser.rows[0] });    
    }catch (err){
        console.error(err);
        res.status(500).json({error: 'Error interno del servidor al registrar'});
    }
};

//Login Usuario
const login = async (req, res) => {
    try{
        const {email, password } = req.body;

        //Buscar usuario por correo
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if(result.rows.length === 0){
            return res.status(401).json({ error: 'Credenciales invalidas' });
        }

        const user = result.rows[0];

        //Comparar constraseñas
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if(!validPassword){
            return res.status(401).json({error: 'Crendenciales invalidas'}); 
        }
            //Generar token 
            const token = jwt.sign(
                {id: user.id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '8h'} //El token espira en 8 horas
            );

            res.json({ message: 'Login exitoso', token, user: {id: user.id, email: user.email, role: user.role} });
        }catch (err){
            console.error(err);
            res.status(500).json({error: 'Error interna del servidor al iniciar sesion'});
        }
    };
    const getUsers = async (req, res) => {
    try{
        const result = await db.query('SELECT id, email FROM users ORDER BY email ASC');
        res.json(result.rows);
    }catch(err){
        res.status(500).json({error: 'Error al obtener usuarios'});
    }
};

    module.exports = {register, login, getUsers};
