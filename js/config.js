/* ============================================================
   Configuración global del módulo de Refacciones
   ============================================================ */
window.CONFIG = {
  MOS_MAX: 1.5,                         // Months of Supply máximo permitido
  AGENCIA_ACTUAL: "Matriz Guadalajara", // Agencia desde la que se genera el pedido
  MONEDA: "MXN"
};

/* Estados posibles de una refacción dentro de un almacén/agencia */
window.ESTADOS_INV = {
  OK:       { etiqueta: "Normal",   clase: "ok"   },
  LENTO:    { etiqueta: "Lento",    clase: "warn" },
  OBSOLETO: { etiqueta: "Obsoleto", clase: "dgr"  }
};

/* Estatus de un pedido */
window.ESTADOS_PEDIDO = {
  pen: "Pendiente",
  apr: "Aprobado",
  rec: "Recibido",
  can: "Cancelado"
};
