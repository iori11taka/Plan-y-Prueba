import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {emptyDocument,validateDocument,safeFilename,escapeHTML,completion,FORMAT_APPROVALS} from '../src/model.js';
import {createPDF} from '../src/pdf.js';

test('Una copia editable conserva todos los campos y las 35 conexiones',()=>{
  const d=emptyDocument();d.client='Cliente & Compañía';d.connections[34]='No conforme';d.corrections.push({connection:'35',responsible:'Ana',date:'2026-09-09',inspector:'Luis',inspectionDate:'2026-09-10',compliant:'Sí'});
  assert.deepEqual(validateDocument(JSON.parse(JSON.stringify(d))),d);
});
test('Importación: rechaza contenido inválido sin aceptar campos arbitrarios',()=>{
  assert.throws(()=>validateDocument({schemaVersion:2}));
  const d=emptyDocument();d.image={data:'javascript:alert(1)',width:1,height:1,name:'bad'};assert.throws(()=>validateDocument(d));
  d.image=null;d.connections[0]='Sin validar';assert.throws(()=>validateDocument(d));
  d.connections[0]='Pendiente';d.result='Inventado';assert.throws(()=>validateDocument(d));
});
test('Las aprobaciones pertenecen al formato y no se modifican mediante borradores o exportaciones',()=>{
  const d=emptyDocument();
  assert.throws(()=>{d.approvals[0].name='ALTERADO';},TypeError);
  d.approvals=[{role:'Aprobación',name:'ALTERADO',position:'X',date:'2099-01-01',status:'Rechazado'}];
  assert.deepEqual(validateDocument(d).approvals,FORMAT_APPROVALS);
  const pdf=createPDF(d).output();
  for(const row of FORMAT_APPROVALS){assert.ok(pdf.includes(row.name));assert.ok(pdf.includes(row.date));}
  assert.ok(!pdf.includes('ALTERADO'));
  delete d.approvals;
  assert.deepEqual(validateDocument(d).approvals,FORMAT_APPROVALS);
});
test('Nombres de archivo y contenido HTML se mantienen seguros',()=>{
  assert.match(safeFilename({...emptyDocument(),code:'../../<script>'}),/^plan-y-prueba-[a-zA-Z0-9_-]+\.pdf$/);
  assert.equal(escapeHTML('<img onerror="x">'),'&lt;img onerror=&quot;x&quot;&gt;');
  assert.equal(completion(emptyDocument()),0);
});
test('El formato vacío produce dos hojas y se puede exportar cada hoja por separado',()=>{
  const d=emptyDocument();
  assert.equal(createPDF(d,'plan').getNumberOfPages(),1);
  assert.equal(createPDF(d,'record').getNumberOfPages(),1);
  assert.equal(createPDF(d).getNumberOfPages(),2);
});
test('El PDF incluye datos, imagen, resultados y tablas; el contenido largo continúa en páginas nuevas',()=>{
  mkdirSync('tmp/pdfs',{recursive:true});
  const d={...emptyDocument(),client:'Cliente de demostración',code:'INT-DEMO-001',quantity:'2',order:'NP-0042',production:'OP-0128',date:'2026-09-09',identifier:'SERIE-DEMO',pressure:'100',duration:'10 minutos',method:'Método de ejemplo',instructions:'Procedimiento de demostración. Sustituir por el procedimiento aprobado para la integración antes de utilizar este documento.',planNotes:'Documento de prueba de la aplicación.',actualPressure:'100',actualMethod:'Método de ejemplo',start:'09:00',end:'09:10',planBy:'Responsable de ejemplo',planReviewer:'Revisor de ejemplo',recordBy:'Responsable de ejemplo',inspector:'Inspector de ejemplo',recordNotes:'Registro de demostración.',needsCorrection:'Sí',result:'Pendiente'};
  d.connections[0]='Conforme';d.connections[1]='No conforme';d.connections[34]='No aplica';
  d.corrections=[{connection:'2',responsible:'Responsable de ejemplo',date:'2026-09-09',inspector:'Inspector de ejemplo',inspectionDate:'2026-09-09',compliant:'Pendiente'}];
  d.equipment=[{name:'Manómetro DEMO-001',expiry:'2027-01-01'}];
  if(process.env.TEST_IMAGE){d.image={data:'data:image/png;base64,'+readFileSync(process.env.TEST_IMAGE).toString('base64'),width:1000,height:500,name:'ensamblaje-demo.png'};}
  const pdf=createPDF(d);writeFileSync('tmp/pdfs/qa-document.pdf',Buffer.from(pdf.output('arraybuffer')));
  assert.equal(pdf.getNumberOfPages(),2,'El documento de tamaño habitual debe ocupar dos hojas');
  d.instructions=('Texto largo de validación: información que debe conservarse sin recortes. ').repeat(220)+' FIN_INSTRUCCIONES';
  d.corrections=Array.from({length:40},(_,i)=>({...d.corrections[0],connection:String(i+1),responsible:'Responsable con nombre extenso y observaciones de seguimiento'}));
  const long=createPDF(d);assert.ok(long.getNumberOfPages()>3);
  writeFileSync('tmp/pdfs/qa-long.pdf',Buffer.from(long.output('arraybuffer')));
});
