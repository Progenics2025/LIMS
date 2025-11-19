const mysql = require('mysql2');

// Create a connection configuration
const connection = mysql.createConnection({
    host: '192.168.29.12',
    user: 'remote_user',
    password: 'Prolab%2305',
    database: 'leadlab_lims'
});

// Connect to the database
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Successfully connected to the database!');
});

// Close the connection when done
connection.end((err) => {
    if (err) {
        console.error('Error closing connection:', err);
        return;
    }
    console.log('Connection closed successfully!');
});