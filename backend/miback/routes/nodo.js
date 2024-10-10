const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middleware/validar-campos');
const { obtenerNodos, crearNodo } = require('../controllers/nodo');

const router = Router(); //Declaramos un router de tipo Router

//get all nodos
router.get('/nodos', obtenerNodos);

//get nodo
//router.get('/nodo', obtenerNodo);

//buscar nodos
//router.get('/nodo/:datos', buscarNodo);

router.post('/nodo', [
    check('tipo_nodo', "El tipo de nodo está vacío").not().isEmpty(),
    check('nombre', "El nombre está vacío").not().isEmpty(),
    check('url', "La url está vacía").not().isEmpty(),
    check('puerto', "El puerto está vacío").not().isEmpty(),
    check('geolocalizacion', "La geolocalización está vacía").not().isEmpty(),
    validarCampos,
], crearNodo);

module.exports = router; // Exportamos el objeto router para que se pueda usar fuera del modulo