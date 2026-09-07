export interface SpeakerPublic {
  id: string;
  slug: string;
  nombre: string;
  foto: string;
  especialidad: string;
  institucion: string;
  pais: string;
  bio: string;
  habilidades: string[];
  experiencias: { cargo: string; institucion: string; inicio: string; fin?: string; actual: boolean; descripcion: string }[];
  eventos_participados: { nombre: string; año: string; rol: string }[];
  links: { linkedin?: string; web?: string; instagram?: string; youtube?: string };
  videos?: { titulo: string; url: string; thumb?: string }[];
}

export const MOCK_SPEAKERS: SpeakerPublic[] = [
  {
    id: 's1', slug: 'dra-carolina-mejia',
    nombre: 'Dra. Carolina Mejía',
    foto: '',
    especialidad: 'Endocrinología', institucion: 'Hospital Universitario San Ignacio', pais: 'Colombia',
    bio: 'Endocrinóloga con más de 15 años de experiencia clínica y docente en el manejo de diabetes mellitus, enfermedades tiroideas y obesidad. Investigadora principal en tres ensayos clínicos multicéntricos sobre terapias GLP-1. Docente de posgrado en la Pontificia Universidad Javeriana.',
    habilidades: ['Diabetes tipo 2', 'Tiroides', 'Obesidad', 'GLP-1', 'Investigación clínica', 'Educación médica'],
    experiencias: [
      { cargo: 'Endocrinóloga tratante', institucion: 'Hospital Universitario San Ignacio', inicio: '2014', actual: true, descripcion: 'Atención de pacientes complejos en consulta y hospitalización.' },
      { cargo: 'Investigadora principal', institucion: 'Pontificia Universidad Javeriana', inicio: '2018', actual: true, descripcion: 'Ensayos clínicos sobre nuevas terapias en diabetes.' },
      { cargo: 'Residente de Endocrinología', institucion: 'Hospital Universitario San Ignacio', inicio: '2011', fin: '2014', actual: false, descripcion: '' },
    ],
    eventos_participados: [
      { nombre: 'Hormobiota V', año: '2024', rol: 'Conferencista principal' },
      { nombre: 'Congreso Diabetes Latam', año: '2023', rol: 'Panelista' },
      { nombre: 'La Eterna Primavera 2023', año: '2023', rol: 'Conferencista' },
    ],
    links: { linkedin: 'https://linkedin.com', web: 'https://dramejiá.com' },
    videos: [{ titulo: 'GLP-1 en la práctica clínica', url: 'https://youtube.com', thumb: '' }],
  },
  {
    id: 's2', slug: 'dr-andres-torres',
    nombre: 'Dr. Andrés Torres',
    foto: '',
    especialidad: 'Cardiología Metabólica', institucion: 'Fundación Valle del Lili', pais: 'Colombia',
    bio: 'Cardiólogo especialista en el manejo de la enfermedad cardiovascular en pacientes con síndrome metabólico. Pionero en Colombia en la implementación de protocolos de rehabilitación cardíaca para pacientes diabéticos.',
    habilidades: ['Síndrome metabólico', 'Rehabilitación cardíaca', 'Riesgo cardiovascular', 'Medicina basada en evidencia'],
    experiencias: [
      { cargo: 'Jefe de Cardiología', institucion: 'Fundación Valle del Lili', inicio: '2016', actual: true, descripcion: 'Dirección del servicio de cardiología y programa de rehabilitación.' },
      { cargo: 'Fellowship Cardiología', institucion: 'Cleveland Clinic', inicio: '2013', fin: '2015', actual: false, descripcion: '' },
    ],
    eventos_participados: [
      { nombre: 'Hormobiota VI', año: '2025', rol: 'Conferencista' },
      { nombre: 'Simposio Cardiometabólico', año: '2024', rol: 'Moderador' },
    ],
    links: { linkedin: 'https://linkedin.com', instagram: 'https://instagram.com' },
  },
  {
    id: 's3', slug: 'dra-lucia-vargas',
    nombre: 'Dra. Lucía Vargas',
    foto: '',
    especialidad: 'Nutrición Clínica', institucion: 'Universidad de Antioquia', pais: 'Colombia',
    bio: 'Nutricionista y dietista especializada en nutrición clínica y terapia médica nutricional en enfermedades crónicas. Autora de más de 20 publicaciones científicas indexadas. Consultora de la OPS en Colombia para programas de alimentación saludable.',
    habilidades: ['Nutrición clínica', 'Dieta mediterránea', 'Microbiota intestinal', 'Divulgación científica'],
    experiencias: [
      { cargo: 'Profesora titular', institucion: 'Universidad de Antioquia', inicio: '2012', actual: true, descripcion: 'Docencia en nutrición clínica y coordinación del grupo de investigación.' },
    ],
    eventos_participados: [
      { nombre: 'La Eterna Primavera 2026', año: '2026', rol: 'Conferencista invitada' },
      { nombre: 'Hormobiota V', año: '2024', rol: 'Panelista' },
    ],
    links: { linkedin: 'https://linkedin.com', youtube: 'https://youtube.com' },
    videos: [{ titulo: 'Microbiota y metabolismo', url: 'https://youtube.com' }],
  },
  {
    id: 's4', slug: 'dr-miguel-palacios',
    nombre: 'Dr. Miguel Palacios',
    foto: '',
    especialidad: 'Medicina Interna', institucion: 'Clínica Las Américas', pais: 'Colombia',
    bio: 'Internista con énfasis en enfermedades autoinmunes y reumatología. Referente nacional en el manejo del lupus eritematoso sistémico y artritis reumatoide.',
    habilidades: ['Autoinmunidad', 'Reumatología', 'Lupus', 'Artritis reumatoide', 'Liderazgo médico'],
    experiencias: [
      { cargo: 'Jefe de Medicina Interna', institucion: 'Clínica Las Américas', inicio: '2018', actual: true, descripcion: '' },
    ],
    eventos_participados: [
      { nombre: 'Congreso Autoinmunidad 2024', año: '2024', rol: 'Conferencista' },
    ],
    links: { linkedin: 'https://linkedin.com' },
  },
  {
    id: 's5', slug: 'dra-isabel-moreno',
    nombre: 'Dra. Isabel Moreno',
    foto: '',
    especialidad: 'Ginecología Endocrina', institucion: 'Hospital Pablo Tobón Uribe', pais: 'Colombia',
    bio: 'Ginecóloga especialista en salud hormonal femenina, menopausia y síndrome de ovario poliquístico. Pionera en Colombia en clínicas integrativas de salud femenina.',
    habilidades: ['Menopausia', 'SOP', 'Salud hormonal femenina', 'Telemedicina', 'Educación en salud'],
    experiencias: [
      { cargo: 'Ginecóloga endocrinóloga', institucion: 'Hospital Pablo Tobón Uribe', inicio: '2015', actual: true, descripcion: '' },
    ],
    eventos_participados: [
      { nombre: 'La Eterna Primavera 2026', año: '2026', rol: 'Conferencista' },
      { nombre: 'Hormobiota VI', año: '2025', rol: 'Panelista' },
    ],
    links: { linkedin: 'https://linkedin.com', instagram: 'https://instagram.com', web: 'https://drmoreno.com' },
  },
  {
    id: 's6', slug: 'dr-roberto-silva',
    nombre: 'Dr. Roberto Silva',
    foto: '',
    especialidad: 'Neurología', institucion: 'Instituto Neurológico de Colombia', pais: 'México',
    bio: 'Neurólogo con subespecialidad en neurología del movimiento y enfermedad de Parkinson. Investigador del CONICET con publicaciones en Nature Neurology y JAMA.',
    habilidades: ['Parkinson', 'Neurología del movimiento', 'Investigación traslacional', 'Divulgación científica'],
    experiencias: [
      { cargo: 'Neurólogo investigador', institucion: 'Instituto Neurológico de Colombia', inicio: '2017', actual: true, descripcion: '' },
    ],
    eventos_participados: [
      { nombre: 'Hormobiota VI', año: '2025', rol: 'Conferencista internacional' },
    ],
    links: { linkedin: 'https://linkedin.com', web: 'https://drsilva.mx' },
  },
];
