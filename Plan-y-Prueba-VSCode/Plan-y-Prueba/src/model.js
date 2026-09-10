export const KEY = 'plan-prueba.document.v1';
export const connectionOptions = ['Pendiente', 'Conforme', 'No conforme', 'No aplica'];
export const sections = ['Datos generales', 'Ensamblaje', 'Plan de prueba', 'Registro de prueba', 'Control documental'];
// Información del formato original, independiente de los datos de cada prueba.
export const FORMAT_APPROVALS = Object.freeze([
  {role:'Elaboración',position:'LIS',name:'Angell Pacheco',date:'23.04.2025',status:'Autorizado'},
  {role:'Revisión',position:'JAR',name:'Luz Fuentes',date:'30.04.2025',status:'Autorizado'},
  {role:'Aprobación',position:'GC',name:'Paul Helden',date:'30.04.2025',status:'Autorizado'},
].map(Object.freeze));
export function emptyDocument() {
  return { schemaVersion: 1, client: '', code: '', quantity: '1', order: '', production: '', date: '', identifier: '',
    pressure: '', pressureUnit: 'PSI', duration: '', method: '', gas: 'Nitrógeno', otherGas: '', instructions: '', planNotes: '',
    actualPressure: '', actualUnit: 'PSI', actualMethod: '', actualGas: 'Nitrógeno', actualOtherGas: '', start: '', end: '',
    needsCorrection: 'Pendiente', result: 'Pendiente', reason: '', recordNotes: '', planBy: '', planReviewer: '', recordBy: '', inspector: '',
    formCode: 'FR-6.3.2.9', version: '01', organization: '', revision: '1', revisionDate: '', change: 'Emisión inicial',
    image: null, connections: Array(35).fill('Pendiente'), corrections: [], equipment: [],
    approvals: FORMAT_APPROVALS };
}
export function safeFilename(d) { return `plan-y-prueba-${(d.code || 'sin-codigo').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0,70)}.pdf`; }
export function completion(d) { return [d.client,d.code,d.date,d.image,d.pressure,d.duration,d.method,d.instructions,d.actualPressure,d.start,d.end,d.recordBy,d.inspector,d.result !== 'Pendiente'].filter(Boolean).length; }
export function validateDocument(value) {
  if (!value || typeof value !== 'object' || value.schemaVersion !== 1) throw new Error('Este archivo no es un documento de Plan & Prueba válido.');
  const base=emptyDocument();
  for(const [key, initial] of Object.entries(base)) {
    if(key==='image') {
      const im=value.image;
      if(im !== null && im !== undefined && (typeof im!=='object' || typeof im.data!=='string' || !/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(im.data) || im.data.length>4000000 || !Number.isFinite(im.width)||!Number.isFinite(im.height)||im.width<=0||im.height<=0||typeof im.name!=='string'||im.name.length>300)) throw new Error('La imagen del archivo no es válida.');
      base.image=im||null;
    } else if(typeof initial==='string') { if(value[key]!==undefined) { if(typeof value[key]!=='string'||value[key].length>20000) throw new Error('El archivo contiene campos inválidos.'); base[key]=value[key]; } }
  }
  if(!Array.isArray(value.connections)||value.connections.length!==35||value.connections.some(v=>!connectionOptions.includes(v))) throw new Error('La lista de conexiones no es válida.');
  base.connections=[...value.connections];
  // Las copias antiguas pueden contener aprobaciones editadas: siempre se restauran las del formato.
  const shapes={corrections:['connection','responsible','date','inspector','inspectionDate','compliant'],equipment:['name','expiry']};
  for(const [key,fields] of Object.entries(shapes)) {
    if(!Array.isArray(value[key])||value[key].length>100) throw new Error('Las tablas del archivo no son válidas.');
    base[key]=value[key].map(row=>Object.fromEntries(fields.map(field=>{if(typeof row?.[field]!=='string'||row[field].length>2000)throw new Error('Hay una fila inválida en el archivo.');return [field,row[field]];})));
  }
  for(const [key, options] of Object.entries({result:['Pendiente','Aprobado','Rechazado'],needsCorrection:['Pendiente','Sí','No'],gas:['Nitrógeno','Otro'],actualGas:['Nitrógeno','Otro'],pressureUnit:['PSI','bar','kPa','MPa'],actualUnit:['PSI','bar','kPa','MPa']})) if(!options.includes(base[key])) throw new Error('El archivo contiene opciones inválidas.');
  return base;
}
export function formatDate(value) { if(!value)return '—'; const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value); return match?`${match[3]}/${match[2]}/${match[1]}`:value; }
export function escapeHTML(value) { return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
