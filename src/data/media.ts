/** Recursos visuales de la plataforma. Se reemplazan cuando llegue el material propio. */
export const media = {
  heroAuditorium: "/534b52e9-ac3b-454b-aa1a-5268bf56bef3.jpg",

  microbiotaNetwork: "/a6ec437b-90ff-4d2b-8ddd-d38c8e91970e.jpg",

  networking: "/d40c3174-74a5-43f7-a045-dfb5d97b3552.jpg",

  stage: "/d8d0dcc7-a602-4d33-8984-942935dfe42c.jpg",

  archiveHall: "/0f1492d4-8719-4674-b410-5f7caec3a03e.jpg",

  /** Logo corporativo: blanco sobre transparente, solo sobre fondo oscuro. */
  logoWhite: "/Logo-eventos-medicos-2048x419.webp",

  /** Logo oficial de HormoBiota 2.0. Lockup vertical (símbolo + palabra + claim).
   *  Principal: versión para fondos claros. Sobre superficies oscuras se usa
   *  la versión de fondos oscuros; nunca se recolorea ni se invierte. */
  logoHormobiota: "/Hombobiota2_logo_Fondos_Claros.png",

  logoHormobiotaDark: "/Hombobiota2_logo_Fondos_oscuros.png",

  /** Trayectoria: una imagen por edición realizada. */
  legacyInflamacion: "/8ab2f475-596c-4a26-9a03-0206a8452934.jpg",

  legacyObesidad: "/5f6a8ad7-b03b-413f-96d7-92781dd38f59.jpg",

  legacyLongevidad: "/632f8133-7202-4a3e-ba59-4ac84cd8e320.jpg",

  legacyHormobiota: "/e0e49db4-ac80-4ea1-b8bd-2da97c634488.jpg",

  /** Retrato clínico para el bloque de concepto. */
  doctorPortrait: "/5ace38ad-82b3-42dd-bd45-8bdfbfcf29f3.jpg",

  hormobiotaHero: "/d4f3ab70-d106-434e-a5aa-86a250795de7.jpg",

  /** Médica dictando una charla virtual a varios colegas: agenda digital. */
  webinarHost: "/27e83e58-5f9f-4da5-889f-29eb38c00e6e.jpg"

} as const;

/** Imagen asociada a cada edición. */
export const editionMedia: Record<string, string> = {
  'ed-hormobiota-2027': media.hormobiotaHero,
  'ed-hormobiota-2026': media.legacyHormobiota
};