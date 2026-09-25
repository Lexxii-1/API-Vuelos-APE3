const express = require('express');

const {
    obtenerVuelos,
    obtenerVuelosHoy,
    obtenerVuelosPorDestino,
    obtenerVueloPorCodigo,
    obtenerVueloPorId,
    crearVuelo,
    actualizarVuelo,
    eliminarVuelo
} = require('../controllers/controller_vuelo');

const router = express.Router();

// IMPORTANTE: las rutas con texto fijo (hoy, destino, codigo)
// deben ir ANTES de '/:id', si no Express interpretaría
// "hoy", "destino" o "codigo" como si fueran un :id.

router.get('/hoy', obtenerVuelosHoy);
router.get('/destino/:destino', obtenerVuelosPorDestino);
router.get('/codigo/:codigo', obtenerVueloPorCodigo);

router.get('/', obtenerVuelos);
router.get('/:id', obtenerVueloPorId);

router.post('/', crearVuelo);

router.put('/:id', actualizarVuelo);

router.delete('/:id', eliminarVuelo);

module.exports = router;
