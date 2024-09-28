const connection = mysql.createConnection({
    host: 'localhost', // Cambia esto si tu base de datos está en otro lugar
    user: 'root', // Usuario de tu base de datos
    database: process.env.BD, // Nombre de la base de datos desde .env
    password: process.env.PWDBD, // Contraseña desde .env
    port: process.env.PORTBD, // Puerto desde .env
});
