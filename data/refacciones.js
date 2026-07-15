/* ============================================================
   Catálogo de Refacciones
   ------------------------------------------------------------
   Cada refacción:
     codigo, descripcion, unidad, categoria, marca
     inventario[]: existencia y estado POR AGENCIA
        { agencia, estado (OK|LENTO|OBSOLETO), existencia, demandaMensual }

   El "estado" permite avisar al gerente cuando la pieza existe
   como OBSOLETO o LENTO en OTRAS agencias.
   El MOS se calcula con la existencia/demanda de la agencia actual.
   ============================================================ */
window.REFACCIONES = [
  {
    codigo: "RF-1001", descripcion: "Balata delantera cerámica", unidad: "JGO", categoria: "Frenos", marca: "Brembo",
    inventario: [
      { agencia: "MG Celaya",   estado: "OK",    existencia: 20, demandaMensual: 40 },
      { agencia: "MG Irapuato",     estado: "OK",    existencia: 5,  demandaMensual: 10 },
      { agencia: "MG Salamanca", estado: "LENTO", existencia: 12, demandaMensual: 2  }
    ]
  },
  {
    codigo: "RF-1002", descripcion: "Balata trasera semimetálica", unidad: "JGO", categoria: "Frenos", marca: "TRW",
    inventario: [
      { agencia: "MG Celaya", estado: "OK", existencia: 14, demandaMensual: 22 }
    ]
  },
  {
    codigo: "RF-1003", descripcion: "Disco de freno ventilado 280mm", unidad: "PZA", categoria: "Frenos", marca: "ATE",
    inventario: [
      { agencia: "MG Celaya",   estado: "OK",       existencia: 8,  demandaMensual: 12 },
      { agencia: "MG Guanajuato",       estado: "OBSOLETO", existencia: 6,  demandaMensual: 0  }
    ]
  },
  {
    codigo: "RF-2001", descripcion: "Filtro de aceite premium", unidad: "PZA", categoria: "Filtros", marca: "Mann",
    inventario: [
      { agencia: "MG Celaya",   estado: "OK",       existencia: 30, demandaMensual: 60 },
      { agencia: "MG Irapuato",     estado: "OBSOLETO", existencia: 8,  demandaMensual: 0  }
    ]
  },
  {
    codigo: "RF-2002", descripcion: "Filtro de aire motor", unidad: "PZA", categoria: "Filtros", marca: "Fram",
    inventario: [
      { agencia: "MG Celaya",   estado: "OK",    existencia: 18, demandaMensual: 25 },
      { agencia: "MG Salamanca", estado: "LENTO", existencia: 22, demandaMensual: 3  }
    ]
  },
  {
    codigo: "RF-2003", descripcion: "Filtro de combustible diésel", unidad: "PZA", categoria: "Filtros", marca: "Bosch",
    inventario: [
      { agencia: "MG Celaya", estado: "OK", existencia: 10, demandaMensual: 15 }
    ]
  },
  {
    codigo: "RF-3001", descripcion: "Aceite sintético 5W-30", unidad: "LT", categoria: "Lubricantes", marca: "Mobil",
    inventario: [
      { agencia: "MG Celaya", estado: "OK", existencia: 120, demandaMensual: 200 }
    ]
  },
  {
    codigo: "RF-3002", descripcion: "Aceite de transmisión ATF", unidad: "LT", categoria: "Lubricantes", marca: "Castrol",
    inventario: [
      { agencia: "MG Celaya", estado: "OK",    existencia: 40, demandaMensual: 55 },
      { agencia: "MG Guanajuato",     estado: "LENTO", existencia: 60, demandaMensual: 5  }
    ]
  },
  {
    codigo: "RF-4001", descripcion: "Bujía de iridio", unidad: "PZA", categoria: "Eléctrico", marca: "NGK",
    inventario: [
      { agencia: "MG Celaya", estado: "OK", existencia: 64, demandaMensual: 90 }
    ]
  },
  {
    codigo: "RF-4002", descripcion: "Batería 12V 65Ah", unidad: "PZA", categoria: "Eléctrico", marca: "LTH",
    inventario: [
      { agencia: "MG Celaya",   estado: "OK",       existencia: 9,  demandaMensual: 14 },
      { agencia: "MG Irapuato",     estado: "OBSOLETO", existencia: 4,  demandaMensual: 0  }
    ]
  },
  {
    codigo: "RF-4003", descripcion: "Alternador 90A remanufacturado", unidad: "PZA", categoria: "Eléctrico", marca: "Valeo",
    inventario: [
      { agencia: "MG Celaya", estado: "OK", existencia: 4, demandaMensual: 6 }
    ]
  },
  {
    codigo: "RF-5001", descripcion: "Amortiguador delantero", unidad: "PZA", categoria: "Suspensión", marca: "Monroe",
    inventario: [
      { agencia: "MG Celaya",   estado: "OK",    existencia: 11, demandaMensual: 16 },
      { agencia: "MG Salamanca", estado: "LENTO", existencia: 9,  demandaMensual: 1  }
    ]
  },
  {
    codigo: "RF-5002", descripcion: "Amortiguador trasero", unidad: "PZA", categoria: "Suspensión", marca: "KYB",
    inventario: [
      { agencia: "MG Celaya", estado: "OK",       existencia: 7,  demandaMensual: 10 },
      { agencia: "MG Guanajuato",     estado: "OBSOLETO", existencia: 5,  demandaMensual: 0  }
    ]
  },
  {
    codigo: "RF-5003", descripcion: "Rótula de suspensión inferior", unidad: "PZA", categoria: "Suspensión", marca: "MOOG",
    inventario: [
      { agencia: "MG Celaya", estado: "OK", existencia: 15, demandaMensual: 20 }
    ]
  },
  {
    codigo: "RF-6001", descripcion: "Banda de distribución (kit)", unidad: "JGO", categoria: "Motor", marca: "Gates",
    inventario: [
      { agencia: "MG Celaya", estado: "OK", existencia: 6, demandaMensual: 9 }
    ]
  },
  {
    codigo: "RF-6002", descripcion: "Bomba de agua", unidad: "PZA", categoria: "Motor", marca: "Aisin",
    inventario: [
      { agencia: "MG Celaya",   estado: "OK",    existencia: 5,  demandaMensual: 7 },
      { agencia: "MG Irapuato",     estado: "LENTO", existencia: 8,  demandaMensual: 1 }
    ]
  }
];
