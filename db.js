const mongoose = require('mongoose');

const mongoUrl = "mongodb+srv://admin:Asesorias2025@bdprueba.27ltjcv.mongodb.net/";

const connectDB = async () => {
  try {
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Conectado a MongoDB");
  } catch (err) {
    console.error("Error de conexión", err);
    process.exit(1);
  }
};

module.exports = connectDB;