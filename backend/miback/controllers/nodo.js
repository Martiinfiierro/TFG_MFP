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
            msg: 'Error nodos',
            error: error
        });
    }
};

const obtenerNodoID = async(req, res) => {
    try{
        let id = req.params.id;
        let nodo = await Nodo.findOne({ where: { id: id }});;

        if (!nodo){
            return res.status(404).json({
              ok: false,
              msg: `Nodo con id ${id} no encontrado`,
            });
        }
      
        return res.json({
            ok: true,
            msg: 'getNodoID',
            nodo: nodo,
        });
    }catch (error) {
        return res.status(400).json({
            ok: false,
            msg: 'Error nodo ID',
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
                        order: [['puerto', 'DESC']],
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
                        order: [['puerto', 'ASC']],
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
                                    { tipo_nodo: { [Op.like]: `%${datos}%` } },
                                    { nombre: { [Op.like]: `%${datos}%` } },
                                    { url: { [Op.like]: `%${datos}%` } },
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
                tipo_nodo: req.body.tipo_nodo,
                nombre: req.body.nombre
            }
        });

        if (nodo) {
            return res.status(409).json({
                ok: false,
                msg: 'Ya existe un nodo con ese tipo_nodo y ese nombre',
            });
        } else {
            let newNodo = await Nodo.create(req.body);
            return res.status(201).json({
                ok: true,
                msg: 'Nodo creado correctamente',
                nodo: newNodo
            });
        }
    } catch (error) {
        return res.status(500).json({
            ok: false,
            msg: 'Error creando el nodo',
            error: error.message
        });
    }
}

module.exports = { obtenerNodos, obtenerNodoID, crearNodo };