const express = require('express');
const vueloRoutes = require('./routes/routes_vuelo');
const app = express();


// Permitir recibir JSON

app.use(express.json());


// Ruta principal

app.get('/', (req, res) => {
    res.json({
        mensaje: 'API REST de Vuelos funcionando'
    });
});


// Rutas de vuelos

app.use(
    '/api/v1/vuelos',
    vueloRoutes
);


// Ruta no encontrada

app.use((req, res) => {
    res.status(404).json({
        mensaje: 'Ruta no encontrada'
    });
});


module.exports = app;