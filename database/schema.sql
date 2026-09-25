DROP TABLE IF EXISTS vuelos;

CREATE TABLE vuelos (
    id                    SERIAL PRIMARY KEY,
    codigo_vuelo          VARCHAR(10)   NOT NULL UNIQUE,
    codigo_aerolinea      VARCHAR(5)    NOT NULL,
    aeropuerto_origen     VARCHAR(100)  NOT NULL,
    aeropuerto_destino    VARCHAR(100)  NOT NULL,
    fecha_hora_salida     TIMESTAMP     NOT NULL,
    fecha_hora_llegada    TIMESTAMP     NOT NULL,
    asientos_disponibles  INTEGER       NOT NULL CHECK (asientos_disponibles >= 0),
    estado                VARCHAR(20)   NOT NULL DEFAULT 'Disponible'
        CHECK (estado IN ('Disponible', 'Retrasado', 'Cancelado', 'Completo'))
);


-- Datos de prueba
INSERT INTO vuelos (
    codigo_vuelo, codigo_aerolinea, aeropuerto_origen, aeropuerto_destino,
    fecha_hora_salida, fecha_hora_llegada, asientos_disponibles, estado
) VALUES
    ('TM101', 'TM', 'Quito (UIO)', 'Guayaquil (GYE)',
        CURRENT_DATE + TIME '08:00', CURRENT_DATE + TIME '09:00', 120, 'Disponible'),

    ('TM202', 'TM', 'Guayaquil (GYE)', 'Cuenca (CUE)',
        CURRENT_DATE + TIME '14:30', CURRENT_DATE + TIME '15:20', 45, 'Disponible'),

    ('AV305', 'AV', 'Quito (UIO)', 'Bogotá (BOG)',
        CURRENT_DATE + INTERVAL '1 day' + TIME '10:00',
        CURRENT_DATE + INTERVAL '1 day' + TIME '11:45', 0, 'Completo'),

    ('CM410', 'CM', 'Guayaquil (GYE)', 'Panamá (PTY)',
        CURRENT_DATE + INTERVAL '2 day' + TIME '06:15',
        CURRENT_DATE + INTERVAL '2 day' + TIME '08:10', 80, 'Retrasado'),

    ('TM505', 'TM', 'Cuenca (CUE)', 'Quito (UIO)',
        CURRENT_DATE - INTERVAL '1 day' + TIME '17:00',
        CURRENT_DATE - INTERVAL '1 day' + TIME '18:00', 0, 'Cancelado');

-- Verificación rápida
SELECT * FROM vuelos ORDER BY id;

