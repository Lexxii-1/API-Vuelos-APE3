const pool = require('../config/database');

const ESTADOS_VALIDOS = ['Disponible', 'Retrasado', 'Cancelado', 'Completo'];

// Codigos de aerolinea permitidos (validacion local, sin
// depender de un servicio externo).
const AEROLINEAS_VALIDAS = ['TM', 'AV', 'CM', 'LA', 'AA'];

const validarCodigoAerolinea = (codigo) => AEROLINEAS_VALIDAS.includes(codigo);

const convertirFecha = (fechaTexto) => {

    const partes = fechaTexto.split(' ');

    if (partes.length !== 2) {
        throw new Error(
            'Formato de fecha invalido. Use DD/MM/YYYY HH:mm:SSS'
        );
    }

    const fecha = partes[0];
    const hora = partes[1];

    const [dia, mes, anio] = fecha.split('/');
    const [horas, minutos, milisegundos] = hora.split(':');

    if (
        !dia ||
        !mes ||
        !anio ||
        !horas ||
        !minutos ||
        !milisegundos
    ) {
        throw new Error(
            'Formato de fecha invalido. Use DD/MM/YYYY HH:mm:SSS'
        );
    }

    return `${anio}-${mes}-${dia} ${horas}:${minutos}:00.${milisegundos}`;
};

// Valida los campos obligatorios de un vuelo antes de insertar/actualizar
const validarCamposVuelo = (body) => {

    const {
        codigo_vuelo,
        codigo_aerolinea,
        aeropuerto_origen,
        aeropuerto_destino,
        fecha_hora_salida,
        fecha_hora_llegada,
        asientos_disponibles,
        estado
    } = body;

    const errores = [];

    if (!codigo_vuelo) errores.push('codigo_vuelo es obligatorio');
    if (!codigo_aerolinea) errores.push('codigo_aerolinea es obligatorio');
    if (!aeropuerto_origen) errores.push('aeropuerto_origen es obligatorio');
    if (!aeropuerto_destino) errores.push('aeropuerto_destino es obligatorio');
    if (!fecha_hora_salida) errores.push('fecha_hora_salida es obligatorio');
    if (!fecha_hora_llegada) errores.push('fecha_hora_llegada es obligatorio');

    if (
        asientos_disponibles === undefined ||
        asientos_disponibles === null ||
        isNaN(Number(asientos_disponibles)) ||
        Number(asientos_disponibles) < 0
    ) {
        errores.push('asientos_disponibles debe ser un numero mayor o igual a 0');
    }

    if (estado && !ESTADOS_VALIDOS.includes(estado)) {
        errores.push(`estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`);
    }

    return errores;
};


// GET - OBTENER TODOS LOS VUELOS
const obtenerVuelos = async (req, res) => {

    try {

        const result = await pool.query(
            `SELECT * FROM vuelos ORDER BY id`
        );

        res.status(200).json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error al obtener los vuelos'
        });
    }
};


// GET - OBTENER VUELOS DISPONIBLES DEL DIA (HOY)
const obtenerVuelosHoy = async (req, res) => {

    try {

        const result = await pool.query(
            `SELECT * FROM vuelos
             WHERE DATE(fecha_hora_salida) = CURRENT_DATE
               AND estado = 'Disponible'
             ORDER BY fecha_hora_salida`
        );

        res.status(200).json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error al obtener los vuelos del dia'
        });
    }
};


// GET - OBTENER VUELOS DISPONIBLES POR DESTINO
const obtenerVuelosPorDestino = async (req, res) => {

    try {

        const { destino } = req.params;

        const result = await pool.query(
            `SELECT * FROM vuelos
             WHERE aeropuerto_destino ILIKE $1
               AND estado = 'Disponible'
             ORDER BY fecha_hora_salida`,
            [destino]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                mensaje: `No hay vuelos disponibles hacia ${destino}`
            });

        }

        res.status(200).json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error al obtener los vuelos por destino'
        });
    }
};


// GET - OBTENER VUELO POR SU CODIGO (codigo_vuelo)
const obtenerVueloPorCodigo = async (req, res) => {

    try {

        const { codigo } = req.params;

        const result = await pool.query(
            `SELECT * FROM vuelos WHERE codigo_vuelo = $1`,
            [codigo]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                mensaje: `No se encontro el vuelo con codigo ${codigo}`
            });

        }

        res.status(200).json(result.rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error al obtener el vuelo por codigo'
        });
    }
};


// GET - OBTENER VUELO POR ID (llave interna de la BD)
const obtenerVueloPorId = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(
            `SELECT * FROM vuelos WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                mensaje: 'Vuelo no encontrado'
            });

        }

        res.status(200).json(result.rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error al obtener el vuelo'
        });
    }
};


// POST - CREAR VUELO
const crearVuelo = async (req, res) => {

    try {

        const errores = validarCamposVuelo(req.body);

        if (errores.length > 0) {
            return res.status(400).json({ mensaje: 'Datos inválidos', errores });
        }

        const {
            codigo_vuelo,
            codigo_aerolinea,
            aeropuerto_origen,
            aeropuerto_destino,
            fecha_hora_salida,
            fecha_hora_llegada,
            asientos_disponibles,
            estado
        } = req.body;

        // validar codigo de aerolina

        if (!validarCodigoAerolinea(codigo_aerolinea)) {
            return res.status(400).json({
                mensaje: `El código de aerolínea ${codigo_aerolinea} no es válido. Use uno de: ${AEROLINEAS_VALIDAS.join(', ')}`
            });
        }

        // Validar fechas

        const salida = convertirFecha(fecha_hora_salida);
        const llegada = convertirFecha(fecha_hora_llegada);

        if (new Date(llegada) <= new Date(salida)) {
            return res.status(400).json({
                mensaje: 'La hora de llegada debe ser posterior a la hora de salida'
            });
        }

        const sql = `
            INSERT INTO vuelos (
                codigo_vuelo,
                codigo_aerolinea,
                aeropuerto_origen,
                aeropuerto_destino,
                fecha_hora_salida,
                fecha_hora_llegada,
                asientos_disponibles,
                estado
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            RETURNING *
        `;

        const values = [
            codigo_vuelo,
            codigo_aerolinea,
            aeropuerto_origen,
            aeropuerto_destino,
            salida,
            llegada,
            asientos_disponibles,
            estado || 'Disponible'
        ];

        const result = await pool.query(sql, values);

        res.status(201).json({
            mensaje: 'Vuelo registrado correctamente',
            vuelo: result.rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(400).json({
            mensaje: 'Error al registrar vuelo',
            error: error.message
        });
    }
};


// PUT - ACTUALIZAR VUELO
const actualizarVuelo = async (req, res) => {

    try {

        const { id } = req.params;

        const errores = validarCamposVuelo(req.body);

        if (errores.length > 0) {
            return res.status(400).json({ mensaje: 'Datos inválidos', errores });
        }

        const {
            codigo_vuelo,
            codigo_aerolinea,
            aeropuerto_origen,
            aeropuerto_destino,
            fecha_hora_salida,
            fecha_hora_llegada,
            asientos_disponibles,
            estado
        } = req.body;

        if (!validarCodigoAerolinea(codigo_aerolinea)) {
            return res.status(400).json({
                mensaje: `El código de aerolínea ${codigo_aerolinea} no es válido. Use uno de: ${AEROLINEAS_VALIDAS.join(', ')}`
            });
        }

        const salida = convertirFecha(fecha_hora_salida);
        const llegada = convertirFecha(fecha_hora_llegada);

        if (new Date(llegada) <= new Date(salida)) {
            return res.status(400).json({
                mensaje: 'La hora de llegada debe ser posterior a la hora de salida'
            });
        }

        const sql = `
            UPDATE vuelos
            SET
                codigo_vuelo = $1,
                codigo_aerolinea = $2,
                aeropuerto_origen = $3,
                aeropuerto_destino = $4,
                fecha_hora_salida = $5,
                fecha_hora_llegada = $6,
                asientos_disponibles = $7,
                estado = $8
            WHERE id = $9
            RETURNING *
        `;

        const values = [
            codigo_vuelo,
            codigo_aerolinea,
            aeropuerto_origen,
            aeropuerto_destino,
            salida,
            llegada,
            asientos_disponibles,
            estado,
            id
        ];

        const result = await pool.query(sql, values);

        if (result.rows.length === 0) {

            return res.status(404).json({
                mensaje: 'Vuelo no encontrado'
            });

        }

        res.status(200).json({
            mensaje: 'Vuelo actualizado correctamente',
            vuelo: result.rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(400).json({
            mensaje: 'Error al actualizar vuelo',
            error: error.message
        });
    }
};


// DELETE - ELIMINAR VUELO
const eliminarVuelo = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM vuelos
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                mensaje: 'Vuelo no encontrado'
            });

        }

        res.status(200).json({
            mensaje: 'Vuelo eliminado correctamente',
            vuelo: result.rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error al eliminar vuelo'
        });
    }
};

module.exports = {
    obtenerVuelos,
    obtenerVuelosHoy,
    obtenerVuelosPorDestino,
    obtenerVueloPorCodigo,
    obtenerVueloPorId,
    crearVuelo,
    actualizarVuelo,
    eliminarVuelo
};
