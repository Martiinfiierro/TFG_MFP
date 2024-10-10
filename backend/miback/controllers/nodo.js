const { Nodo } = require('../models/nodo');
const { Op } = require('sequelize');

const obtenerNodos = async(req, res) => {
    try{
        let nodos;

        nodos = await Nodo.findAll();
        
        return res.json({
            ok: true,
            msg: 'getNodos',
            nodos: nodos,
        });
    }catch (error) {
        return res.status(400).json({
            ok: false,
            msg: 'Error obteniendo productos para el dataset',
            error: error
        });
    }
};

/*const buscarProducto = async(req, res) => {
    const datos = req.params.datos;

    //Paginación 
    const desde = Number(req.query.desde) || 0; //Si no dan nada o no dan un numero es 0
    const registropp = 100000;

    console.log(datos);

    try{
        let productos, total;

        //Comprobacion si se ordena por cantidad(ASC/DESC) o precio(ASC/DESC)
        switch (datos) {
            case 'cantidadDESC':
                    [productos, total] = await Promise.all([
                    Producto.findAll({
                        order: [['stock', 'DESC']],
                        offset: desde,
                        limit: registropp,
                        include: [
                            Ubicacion,
                            Promocion,
                        ]
                    }),
                    //Total de usuarios que hay en la base de datos
                    Producto.count()
                    ]);

                break;
            case 'cantidadASC':
                    [productos, total] = await Promise.all([
                    Producto.findAll({
                        order: [['stock', 'ASC']],
                        offset: desde,
                        limit: registropp,
                        include: [
                            Ubicacion,
                            Promocion,
                        ]
                    }),
                    //Total de usuarios que hay en la base de datos
                    Producto.count()
                    ]);

                break;
            case 'precioASC':
                    [productos, total] = await Promise.all([
                    Producto.findAll({
                        order: [['precio', 'ASC']],
                        offset: desde,
                        limit: registropp,
                        include: [
                            Ubicacion,
                            Promocion,
                        ]
                    }),
                    //Total de usuarios que hay en la base de datos
                    Producto.count()
                    ]);

                break;
            case 'precioDESC':
                    [productos, total] = await Promise.all([
                    Producto.findAll({
                        order: [['precio', 'DESC']],
                        offset: desde,
                        limit: registropp,
                        include: [
                            Ubicacion,
                            Promocion,
                        ]
                    }),
                    //Total de usuarios que hay en la base de datos
                    Producto.count()
                    ]);

                break;
                   
            default:
                    [productos, total] = await Promise.all([
                        Producto.findAll({
                            where: {
                                [Op.or]: [
                                    { nombre: { [Op.like]: `%${datos}%` } },
                                    { marca: { [Op.like]: `%${datos}%` } },
                                    { categoria: { [Op.like]: `%${datos}%` } },
                                ],
                            },
                            offset: desde,
                            limit: registropp,
                            include: [
                                Ubicacion,
                                Promocion,
                            ]
                        }),
                        //Total de usuarios que hay en la base de datos
                        Producto.count()
                    ]);
                break;
            
        }

        
        res.json({
            ok: true,
            msg: 'buscarProductos',
            productos: productos,
            page: {
                desde,
                registropp,
                total
            }
        });
    }catch (error) {
        return res.status(400).json({
            ok: false,
            msg: 'Error buscando productos',
            error: error
        });
    }
}*/


const crearNodo = async (req, res) => {
    try {
        let nodo = await Nodo.findOne({
            where: { 
                tipo_nodo: req.body.tipo_nodo,  // Asegúrate de acceder correctamente a req.body
                nombre: req.body.nombre 
            }
        });

        if (nodo) {
            return res.status(409).json({ // Cambié aquí para usar el método `status`
                ok: false, // Cambiado a false, ya que no se creó un nodo
                msg: 'Ya existe un nodo con ese nombre y ese tipo',
            });
        } else {
            let newNodo = await Nodo.create(req.body);
            return res.status(201).json({ // Usa el código 201 para recursos creados
                ok: true,
                msg: 'Nodo creado correctamente',
                nodo: newNodo
            });
        }
    } catch (error) {
        return res.status(500).json({ // Cambiado a 500 para errores del servidor
            ok: false,
            msg: 'Error creando el nodo',
            error: error.message // Puedes enviar solo el mensaje del error para no exponer detalles
        });
    }
}

module.exports = { obtenerNodos, crearNodo };