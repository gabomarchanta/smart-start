import { writable } from 'svelte/store';
import { browser } from '$app/environment'; // Para verificar si estamos en el navegador
import type { SmartStartData, Category, Subcategory, Link } from '$lib/types/definitions';
import { debounce } from '$lib/utils/debounce';

// --- Estado de Guardado ---
export const isSaving = writable<boolean>(false); // <-- Nuevo store

// --- Valor Inicial / Por Defecto ---
// Puedes poner aquí una estructura de ejemplo si quieres que el usuario empiece con algo
const defaultData: SmartStartData = [
  {
    id: crypto.randomUUID(),
    title: 'Trabajo',
    icon: 'Briefcase',
    subcategories: [
      {
        id: crypto.randomUUID(),
        title: 'Diseño',
        icon: 'Palette',
        links: [
          { id: crypto.randomUUID(), title: 'Figma', url: 'https://figma.com' },
          { id: crypto.randomUUID(), title: 'Coolors', url: 'https://coolors.co' }
        ]
      }
    ],
    links: [
       { id: crypto.randomUUID(), title: 'Google Drive', url: 'https://drive.google.com' },
       { id: crypto.randomUUID(), title: 'Notion', url: 'https://notion.so' }
    ]
  },
   {
    id: crypto.randomUUID(),
    title: 'Ocio',
    icon: 'Gamepad2',
    subcategories: [],
    links: [
       { id: crypto.randomUUID(), title: 'YouTube', url: 'https://youtube.com' },
       { id: crypto.randomUUID(), title: 'Reddit', url: 'https://reddit.com' }
    ]
  }
];

// --- Clave para localStorage ---
const STORAGE_KEY = 'smartStartData_v2'; // Usa una clave específica

// --- Función para cargar desde localStorage ---
function loadData(): SmartStartData {
  if (!browser) {
    return []; // No hacer nada en el servidor, retorna vacío o defaultData si prefieres
  }

  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      // TODO: Añadir validación más robusta aquí si la estructura cambia mucho en el futuro
      return JSON.parse(storedData) as SmartStartData;
    }
  } catch (error) {
    console.error("Error loading data from localStorage:", error);
    // Si hay error (ej. datos corruptos), eliminar el item malo y usar default
    localStorage.removeItem(STORAGE_KEY);
  }

  // Si no hay datos o hubo error, retorna los datos por defecto
  // O retorna un array vacío [] si prefieres empezar limpio
  return defaultData;
}

// --- Creación del Store ---
const initialData = loadData();
const categoriesStore = writable<SmartStartData>(initialData);

// --- Persistencia Automática DEBOUNCED en localStorage ---
if (browser) {
	// Crear la función debounced para guardar
	const saveToLocalStorageDebounced = debounce((dataToSave: SmartStartData) => {
    isSaving.set(true); // <-- MOSTRAR INDICADOR JUSTO ANTES DE GUARDAR
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
        console.error('Error saving data to localStorage:', error);
    } finally {
        // Esperar un poquito para que el usuario vea el indicador
        setTimeout(() => {
            isSaving.set(false);
        }, 300); // 300ms de "show time" para el indicador
    }
}, 750); // Esperar 750ms después del último cambio antes de guardar

	// Suscribirse a cambios en el store
	categoriesStore.subscribe((currentData) => {
        // No poner isSaving(true) aquí, sería demasiado pronto y frecuente.
        // Podríamos ponerlo justo antes de llamar a saveToLocalStorageDebounced,
        // pero se mostraría brevemente incluso si otro cambio cancela el guardado.
        // Mejor ponerlo justo antes de la escritura real si es posible,
        // o vivir con una pequeña imprecisión para simplificar.

        // Llamar a la función debounced cada vez que el store cambie
        saveToLocalStorageDebounced(currentData);

        // Alternativa: Mostrar "Guardando" un poco antes (más simple)
        // isSaving.set(true); // <-- Mostrar al iniciar el timer de debounce
	});

    // Podríamos querer mostrar el indicador explícitamente después de importar
    // (aunque el set() del store ya activará la suscripción debounced)
}

// --- Helper Functions (Mutaciones) ---
// Estas funciones hacen más fácil modificar el store desde los componentes

export function addCategory(title: string) {
  const newCategory: Category = {
    id: crypto.randomUUID(),
    title,
    subcategories: [],
    links: []
  };
  categoriesStore.update(data => [...data, newCategory]);
}

export function addSubcategory(categoryId: string, title: string) {
  if (!title.trim()) return; // Evita títulos vacíos

  const newSubcategory: Subcategory = {
    id: crypto.randomUUID(),
    title,
    links: []
  };
  categoriesStore.update(data =>
    data.map(cat =>
      cat.id === categoryId
        ? { ...cat, subcategories: [...cat.subcategories, newSubcategory] }
        : cat
    )
  );
}

// --- Función de utilidad para formatear URL ---
function formatUrl(url: string): string {
    const trimmedUrl = url.trim();
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
        return trimmedUrl; // Ya tiene protocolo, no hacer nada
    }
    // Añadir https:// por defecto si no tiene protocolo
    return `https://${trimmedUrl}`;
}

export function addLink(parentId: string, linkData: { title: string; url: string }, parentType: 'category' | 'subcategory') {
    if (!linkData.title.trim() || !linkData.url.trim()) return; // Evita datos vacíos

    // Simple validación de URL (puede mejorarse)
    let formattedUrl = linkData.url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl; // Añade https:// por defecto si falta
    }
    
    const newLink: Link = {
        id: crypto.randomUUID(),
        title: linkData.title.trim(),
        url: formatUrl(linkData.url),
        // icon: podríamos intentar obtenerlo aquí o dejarlo para después
    };

    categoriesStore.update(data =>
        data.map(cat => {
            if (parentType === 'category' && cat.id === parentId) {
                return { ...cat, links: [...cat.links, newLink] };
            } else if (parentType === 'subcategory') {
                const updatedSubcategories = cat.subcategories.map(sub =>
                    sub.id === parentId
                        ? { ...sub, links: [...sub.links, newLink] }
                        : sub
                );
                // Solo actualiza la categoría si una de sus subcategorías cambió
                if (JSON.stringify(updatedSubcategories) !== JSON.stringify(cat.subcategories)) {
                   return { ...cat, subcategories: updatedSubcategories };
                }
            }
            return cat;
        })
    );
}

export function deleteLink(parentId: string, linkId: string, parentType: 'category' | 'subcategory') {
  categoriesStore.update(data =>
    data.map(cat => {
      if (parentType === 'category' && cat.id === parentId) {
        // Eliminar enlace directo de la categoría
        return { ...cat, links: cat.links.filter(link => link.id !== linkId) };
      } else if (parentType === 'subcategory') {
        // Buscar la subcategoría y filtrar sus enlaces
        return {
          ...cat,
          subcategories: cat.subcategories.map(sub =>
            sub.id === parentId
              ? { ...sub, links: sub.links.filter(link => link.id !== linkId) }
              : sub
          )
        };
      }
      return cat;
    })
  );
}

export function deleteSubcategory(categoryId: string, subcategoryId: string) {
  categoriesStore.update(data =>
    data.map(cat =>
      cat.id === categoryId
        ? { ...cat, subcategories: cat.subcategories.filter(sub => sub.id !== subcategoryId) }
        : cat
    )
  );
}

export function deleteCategory(categoryId: string) {
  categoriesStore.update(data =>
    data.filter(cat => cat.id !== categoryId)
  );
}

export function updateLink(parentId: string, linkId: string, parentType: 'category' | 'subcategory', newLinkData: { title: string; url: string }) {
  if (!newLinkData.title.trim() || !newLinkData.url.trim()) return; // Validación básica

  // Validación/formateo simple de URL
  let formattedUrl = newLinkData.url.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
  }

  const updatedLinkData = {
      title: newLinkData.title.trim(),
      url: formatUrl(newLinkData.url),
  };

  categoriesStore.update(data =>
      data.map(cat => {
          if (parentType === 'category' && cat.id === parentId) {
              // Actualizar enlace directo de la categoría
              return {
                  ...cat,
                  links: cat.links.map(link =>
                      link.id === linkId ? { ...link, ...updatedLinkData } : link
                  )
              };
          } else if (parentType === 'subcategory') {
              // Buscar la subcategoría y actualizar su enlace
              return {
                  ...cat,
                  subcategories: cat.subcategories.map(sub =>
                      sub.id === parentId
                          ? {
                                ...sub,
                                links: sub.links.map(link =>
                                    link.id === linkId ? { ...link, ...updatedLinkData } : link
                                )
                            }
                          : sub
                  )
              };
          }
          return cat;
      })
  );
}

// Modificamos updateSubcategoryTitle para que sea updateSubcategory
export function updateSubcategory(categoryId: string, subcategoryId: string, newData: { title?: string; icon?: string }) {
  if (!newData.title?.trim() && !newData.icon) return; // Debe haber algo que actualizar

  categoriesStore.update(data =>
      data.map(cat =>
          cat.id === categoryId
              ? {
                  ...cat,
                  subcategories: cat.subcategories.map(sub => {
                      if (sub.id === subcategoryId) {
                          const updatedSub = { ...sub };
                          if (newData.title?.trim()) {
                              updatedSub.title = newData.title.trim();
                          }
                          if (newData.icon !== undefined) { // Permitir string vacío para quitar icono
                              updatedSub.icon = newData.icon || undefined; // Si es string vacío, poner undefined
                          }
                          return updatedSub;
                      }
                      return sub;
                  })
              }
              : cat
      )
  );
}

// Modificamos updateCategoryTitle para que sea updateCategory
export function updateCategory(categoryId: string, newData: { title?: string; icon?: string }) {
  if (!newData.title?.trim() && !newData.icon) return;

  categoriesStore.update(data =>
      data.map(cat => {
          if (cat.id === categoryId) {
              const updatedCat = { ...cat };
              if (newData.title?.trim()) {
                  updatedCat.title = newData.title.trim();
              }
              if (newData.icon !== undefined) {
                  updatedCat.icon = newData.icon || undefined;
              }
              return updatedCat;
          }
          return cat;
      })
  );
}

export function moveCategory(fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) return; // No hacer nada si no hay movimiento

  categoriesStore.update(data => {
      const updatedData = [...data]; // Crear copia mutable
      const [movedItem] = updatedData.splice(fromIndex, 1); // Sacar el elemento movido
      updatedData.splice(toIndex, 0, movedItem); // Insertarlo en la nueva posición
      return updatedData; // Devolver el array reordenado
  });
}

export function moveSubcategory(categoryId: string, fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) return;

  categoriesStore.update(data =>
      data.map(cat => {
          if (cat.id === categoryId) {
              // Estamos en la categoría correcta, reordenamos sus subcategorías
              const updatedSubcategories = [...cat.subcategories]; // Copia mutable
              const [movedItem] = updatedSubcategories.splice(fromIndex, 1);
              updatedSubcategories.splice(toIndex, 0, movedItem);
              return { ...cat, subcategories: updatedSubcategories }; // Devolver categoría con subcategorías reordenadas
          }
          return cat; // No es la categoría, devolverla sin cambios
      })
  );
}

export function moveLink(parentId: string, parentType: 'category' | 'subcategory', fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) return;

  categoriesStore.update(data =>
      data.map(cat => {
          if (parentType === 'category' && cat.id === parentId) {
              // Reordenar enlace directo en la categoría
              const updatedLinks = [...cat.links];
              const [movedItem] = updatedLinks.splice(fromIndex, 1);
              updatedLinks.splice(toIndex, 0, movedItem);
              return { ...cat, links: updatedLinks };
          } else if (parentType === 'subcategory') {
              // Buscar la subcategoría y reordenar sus enlaces
              const updatedSubcategories = cat.subcategories.map(sub => {
                  if (sub.id === parentId) {
                      // Encontrada la subcategoría correcta
                      const updatedLinks = [...sub.links];
                      const [movedItem] = updatedLinks.splice(fromIndex, 1);
                      updatedLinks.splice(toIndex, 0, movedItem);
                      return { ...sub, links: updatedLinks };
                  }
                  return sub; // No es esta subcategoría
              });
              // Solo retornar categoría modificada si realmente se actualizó una subcategoría
               if (JSON.stringify(updatedSubcategories) !== JSON.stringify(cat.subcategories)) {
                 return { ...cat, subcategories: updatedSubcategories };
              }
          }
          return cat; // No es la categoría/subcategoría correcta
      })
  );
}


// --- Exportar el Store ---
export default categoriesStore;