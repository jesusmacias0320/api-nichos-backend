const jwt = require('jsonwebtoken');

const verifyToken = (req, res , next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token){
        return res.status(403).json({error: 'Se requiere un token de autenticación'});
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }catch(err){
        return res.status(401).json({error: 'Token inválido o expirado'});

    }
};

const isAdmin = (req, res, next) =>{
    if (req.user.role !== 'admin'){
        return res.status(403).json({error: 'Acceso denegado. Se requiere permisos de administrador'});
    }
    next();
};

module.exports = {verifyToken, isAdmin}
