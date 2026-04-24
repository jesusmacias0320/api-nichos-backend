const db = require('../config/db');

const { v4: uuidv4} = require('uuid');

//Leer todos los nichos
const getAllNiches = async (req, res) => {
    try{
        //Traer información del nicho
        const result = await db.query(`
           SELECT n.*, u.email as owner_email
           FROM niches n
           LEFT JOIN users u ON n.owner_id = u.id
           ORDER BY n.code ASC 
           `);

           res.json(result.rows);
    }catch (err){
        console.error(err);
        res.status(500).json({ error: 'Error al obtener la lista de nichos'});
    }
};

//CREAR NUEVO NICHO
const createNiche = async (req, res) => {
    try{
        const { code, location } = req.body;

        if (!code || !location){
            return res.status(400).json({error: 'El codigo y la ubicacion son obligatorios'});   
        }

        const nicheExists = await db.query('SELECT * FROM niches WHERE code = $1', [code]);
        if (nicheExists.rows.length > 0) {
            return res.status(400).json({error: 'Ya existe un nicho con este código'})
        }
        const newId = uuidv4();

        const newNiche = await db.query(
            'INSERT INTO niches (id, code, location) VALUES ($1, $2, $3) RETURNING *',
            [newId, code, location]
        );

        res.status(201).json({
            message: 'Nicho creado con éxito',
            niche: newNiche.rows[0]
        });
    }catch (err) {
        console.error(err);
        res.status(500).json({error: 'Erro al crear el nicho'});
    }
};

//TRANSFERIR UN NICHO (ELIMINADO LÓGICO)

const transferNiche = async (req, res) => {
    const { id } = req.params;
    const { new_owner_id, reason, deceased_name, birth_date, death_date } = req.body;

    try{
        const nicheResult = await db.query('SELECT * FROM niches WHERE id = $1', [id]);
        if(nicheResult.rows.length === 0) 
        return res.status(404).json({error: 'Nicho no encontrado'});
        
        const previous_owner_id = nicheResult.rows[0].owner_id;

        await db.query(
            "UPDATE niches SET owner_id = $1, deceased_name = $2, birth_date = $3, death_date = $4, status = 'transferido', updated_at = CURRENT_TIMESTAMP WHERE id = $5",
            [new_owner_id, deceased_name, birth_date || null, death_date || null, id]
        );

        await db.query(
            'INSERT INTO transfers (niche_id, previous_owner_id, new_owner_id, reason, deceased_name) VALUES ($1,$2,$3,$4,$5)',
            [id, previous_owner_id, new_owner_id, reason, deceased_name]
        );

        res.json({message: 'Nicho transferido y guardado en el historial con éxito '});
    }catch(err){
        console.error(err);
        res.status(500).json({error: 'Error interno al procesar la transferencia'});
    }
};

//Historial
const getTransferHistory = async (req, res) => {
    try{
        const  query = `
        SELECT
        t.id,
        n.code as niche_code,
        u1.email as previous_owner,
        u2.email as new_owner,
        t.reason,
        t.transfer_date,
        t.deceased_name
        FROM transfers t
        JOIN niches n ON t.niche_id = n.id
        LEFT JOIN users u1 ON t.previous_owner_id = u1.id
        LEFT JOIN users u2 ON t.new_owner_id = u2.id
        ORDER BY t.transfer_date DESC
        `;
        const result = await db.query(query);
        res.json(result.rows);
    }catch (err){
        console.error(err);
        res.status(500).json({error: 'Error al obtener el historial'});
    }
};

//VER NICHOS

const getMyNiches = async (req, res) => {
    try{
       const userID = req.user.id;
       const result = await db.query(`
        SELECT id, code, location, status
        FROM niches
        WHERE owner_id = $1
        ORDER BY code ASC
        `,[userID]);

       res.json(result.rows);   
    }catch(err){
        console.error(err);
        res.status(500).json({error:'Error al obtener tus nichos'});
    }
};

//Liberar Nicho
const releaseNiche = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    try {
        // 1. Obtener el dueño y fallecido actual
        const nicheData = await db.query('SELECT owner_id, deceased_name FROM niches WHERE id = $1', [id]);
        
        // Validación de seguridad por si el nicho no existe
        if (nicheData.rows.length === 0) {
            return res.status(404).json({error: 'Nicho no encontrado'});
        }
        
        const previous_owner = nicheData.rows[0].owner_id;
        const past_deceased = nicheData.rows[0].deceased_name; // <-- Capturamos al fallecido antes de borrarlo

        // 2. Vaciar nicho y ponerlo disponible
        
        await db.query (
            `UPDATE niches SET status = 'disponible', owner_id = NULL, deceased_name = NULL, birth_date = NULL, death_date = NULL WHERE id = $1`,
            [id]
        );

        // 3. Registrar salida en el historial 
    
        await db.query(
            `INSERT INTO transfers (niche_id, previous_owner_id, new_owner_id, reason, deceased_name) VALUES ($1, $2, NULL, $3, $4)`,
            [id, previous_owner, reason, past_deceased]
        );

        res.json({message: 'Nicho liberado exitosamente'});

    } catch(err) {
        // Imprimimos el error en la consola para depuración
        console.error("ERROR AL LIBERAR:", err.message);
        res.status(500).json({error: 'Error al liberar el nicho', detalle: err.message});
    }
};




module.exports = {getAllNiches, createNiche, transferNiche, getTransferHistory, getMyNiches, releaseNiche};