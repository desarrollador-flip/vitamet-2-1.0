const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
// Parsear este endpoint antes de los parsers globales para aplicar su límite y errores JSON.
app.use('/api', require('./routes/submitEmail'));
app.use('/api', require('./routes/submitCon'));
app.use('/api', require('./routes/submitCv'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const submitRoutes = require('./routes/submit');
const agentesRoutes = require('./routes/agentes');

app.use('/api', submitRoutes);
app.use('/api', agentesRoutes);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
}

module.exports = app;
