import { Schema } from 'mongoose';

export const TransaccionSchema = new Schema({
  _id: String,
  rut_origen: String,
  cuenta_origen_id: String,
  rut_destino: String,
  cuenta_destino_id: String,
  tipo: { type: String, enum: ['transferencia', 'compra', 'retiro', 'deposito'] },
  monto: Number,
  fecha: Date,
  nombre_destino: String,
  estado: { type: String, enum: ['completada', 'pendiente', 'rechazada', 'bloqueada'] },
  metodo: String,
  tarjeta_id: String,
  detalles_fraude: {
    sospechosa: Boolean,
    motivo: String,
    analizado_por: String,
  },
});
