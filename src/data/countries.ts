export interface Country {
  name: string;
  iso: string;
  dialCode: string;
}

/** Colombia primero (sede del evento), luego el resto de Latinoamérica,
 * luego otros países frecuentes. Suficiente para un formulario B2B real
 * sin intentar cubrir los ~195 países del mundo. */
export const countries: Country[] = [
{ name: 'Colombia', iso: 'CO', dialCode: '+57' },
{ name: 'México', iso: 'MX', dialCode: '+52' },
{ name: 'Argentina', iso: 'AR', dialCode: '+54' },
{ name: 'Chile', iso: 'CL', dialCode: '+56' },
{ name: 'Perú', iso: 'PE', dialCode: '+51' },
{ name: 'Ecuador', iso: 'EC', dialCode: '+593' },
{ name: 'Venezuela', iso: 'VE', dialCode: '+58' },
{ name: 'Bolivia', iso: 'BO', dialCode: '+591' },
{ name: 'Paraguay', iso: 'PY', dialCode: '+595' },
{ name: 'Uruguay', iso: 'UY', dialCode: '+598' },
{ name: 'Panamá', iso: 'PA', dialCode: '+507' },
{ name: 'Costa Rica', iso: 'CR', dialCode: '+506' },
{ name: 'Guatemala', iso: 'GT', dialCode: '+502' },
{ name: 'Honduras', iso: 'HN', dialCode: '+504' },
{ name: 'El Salvador', iso: 'SV', dialCode: '+503' },
{ name: 'Nicaragua', iso: 'NI', dialCode: '+505' },
{ name: 'República Dominicana', iso: 'DO', dialCode: '+1' },
{ name: 'Cuba', iso: 'CU', dialCode: '+53' },
{ name: 'Puerto Rico', iso: 'PR', dialCode: '+1' },
{ name: 'Estados Unidos', iso: 'US', dialCode: '+1' },
{ name: 'Canadá', iso: 'CA', dialCode: '+1' },
{ name: 'España', iso: 'ES', dialCode: '+34' },
{ name: 'Portugal', iso: 'PT', dialCode: '+351' },
{ name: 'Francia', iso: 'FR', dialCode: '+33' },
{ name: 'Alemania', iso: 'DE', dialCode: '+49' },
{ name: 'Italia', iso: 'IT', dialCode: '+39' },
{ name: 'Reino Unido', iso: 'GB', dialCode: '+44' },
{ name: 'Brasil', iso: 'BR', dialCode: '+55' },
{ name: 'Otro país', iso: 'XX', dialCode: '+' }];


export const defaultCountry = countries[0];
