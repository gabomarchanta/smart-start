export interface Link {
    id: string; // Identificador único para cada enlace
    title: string;
    url: string;
    // icon?: string; // Opcional: Podría ser una URL a un favicon o un identificador de icono
    // Añadir más campos si es necesario (ej. descripción)
  }
  
  export interface Subcategory {
    id: string; // Identificador único
    title: string;
    icon?: string;
    links: Link[]; // Los enlaces pertenecen a esta subcategoría
  }
  
  export interface Category {
    id: string; // Identificador único
    title: string;
    icon?: string;
    subcategories: Subcategory[]; // Subcategorías dentro de esta categoría
    links: Link[]; // Enlaces que pertenecen DIRECTAMENTE a esta categoría (no en una subcategoría)
  }
  
  // El tipo principal que manejará nuestro store: un array de Categorías
  export type SmartStartData = Category[];