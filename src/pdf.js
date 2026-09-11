import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {formatDate, FORMAT_APPROVALS} from './model.js';
import { SWAGELOK_S_LOGO_DATA } from './logo-data.js';
const ink=[0,75,135], green=[234,243,249], gray=[91,105,120];
export function createPDF(d, selection='both') {
  const pdf=new jsPDF({unit:'mm',format:'a4'}); let y=38, currentTitle='', first=true;
  const drawnHeaders=new Set();
  const text=v=>String(v||'—');
  const header=()=>{
    const page=pdf.internal.getCurrentPageInfo().pageNumber;if(drawnHeaders.has(page))return;drawnHeaders.add(page);
    pdf.setFillColor(...ink);pdf.rect(0,0,210,29,'F');
    pdf.addImage(SWAGELOK_S_LOGO_DATA,'PNG',12,4.2,18,18,undefined,'FAST');
    pdf.setTextColor(255,255,255);pdf.setFont('helvetica','bold');pdf.setFontSize(9);pdf.text('SWAGELOK PERÚ  |  PLAN & PRUEBA',34,10);
    pdf.setTextColor(255);pdf.setFontSize(12);pdf.text(currentTitle,34,18);pdf.setFontSize(7);pdf.setFont('helvetica','normal');pdf.text('Fuga y/o estanqueidad de sistemas integrados',34,24);
    pdf.setFontSize(8);pdf.text(text(d.formCode).slice(0,40),198,10,{align:'right'});pdf.text(`Versión ${text(d.version).slice(0,20)}`,198,15,{align:'right'});
  };
  const begin=title=>{if(!first)pdf.addPage();first=false;currentTitle=title;y=36;header();};
  const table=(head,body,extra={})=>{
    autoTable(pdf,{startY:y,head:head?[head]:undefined,body,theme:'grid',margin:{top:36,bottom:17,left:12,right:12},styles:{font:'helvetica',fontSize:8,cellPadding:2,lineColor:[213,222,223],lineWidth:.15,textColor:ink,overflow:'linebreak'},headStyles:{fillColor:green,textColor:ink,fontStyle:'bold'},didDrawPage:header,...extra});y=pdf.lastAutoTable.finalY+3;
  };
  const section=label=>{if(y>267){pdf.addPage();header();y=36;}pdf.setTextColor(...gray);pdf.setFont('helvetica','bold');pdf.setFontSize(8);pdf.text(label.toUpperCase(),12,y);y+=3;};
  const metadata=()=>table(null,[[`CLIENTE\n${text(d.client)}`,`INTEGRACIÓN\n${text(d.code)}`,`FECHA\n${formatDate(d.date)}`],[`NOTA DE PEDIDO\n${text(d.order)}`,`ORDEN DE PRODUCCIÓN\n${text(d.production)}`,`CANTIDAD / IDENTIFICADOR\n${text(d.quantity)} / ${text(d.identifier)}`]],{styles:{fontSize:8,cellPadding:2.4}});
  const assembly=(height)=>{
    if(y+height>280){pdf.addPage();header();y=36;}
    pdf.setDrawColor(213,222,223);pdf.setFillColor(249,251,250);pdf.rect(12,y,186,height,'FD');
    if(d.image){const {width,height:ih,data}=d.image;const scale=Math.min(178/width,(height-6)/ih);pdf.addImage(data,'JPEG',12+(186-width*scale)/2,y+(height-ih*scale)/2,width*scale,ih*scale,undefined,'FAST');}
    else {pdf.setFont('helvetica','normal');pdf.setTextColor(...gray);pdf.setFontSize(9);pdf.text('Imagen de ensamblaje pendiente',105,y+height/2,{align:'center'});}
    y+=height+4;
  };
  const approvals=()=>{section('Control documental del formato');table(['Etapa','Cargo','Nombre','Fecha','Firma'],FORMAT_APPROVALS.map(r=>[r.role,r.position,r.name,r.date,r.status]),{styles:{fontSize:7,cellPadding:1.4}});};
  if(selection==='both'||selection==='plan'){
    begin('PLAN DE PRUEBA');metadata();
    table(['Presión propuesta','Duración propuesta','Método','Gas de prueba'],[[`${text(d.pressure)} ${d.pressureUnit}`,text(d.duration),text(d.method),d.gas==='Otro'?text(d.otherGas):d.gas]]);
    section('Ensamblaje · conexiones enumeradas');assembly(68);
    table(null,[['C · Válvula cerrada','A · Válvula abierta','M · Manómetro','R · Regulador']],{styles:{fontSize:7,cellPadding:1.5}});
    table(['Secuencia de tareas e instrucciones'],[[text(d.instructions)]]);
    if(d.planNotes)table(['Notas'],[[d.planNotes]]);
    table(['Realizado por','Revisado por'],[[text(d.planBy),text(d.planReviewer)]]);
    table(['Revisión','Fecha de actualización','Descripción del cambio'],[[text(d.revision),formatDate(d.revisionDate),text(d.change)]]);
    approvals();
  }
  if(selection==='both'||selection==='record'){
    begin('REGISTRO DE PRUEBA');metadata();
    table(['Presión suministrada','Método','Inicio / finalización','Gas de prueba'],[[`${text(d.actualPressure)} ${d.actualUnit}`,text(d.actualMethod),`${text(d.start)} / ${text(d.end)}`,d.actualGas==='Otro'?text(d.actualOtherGas):d.actualGas]]);
    section('Ensamblaje');assembly(45);
    section('Inspección de conexiones');
    const labels={'Pendiente':'P','Conforme':'C','No conforme':'NC','No aplica':'NA'};
    table(null,Array.from({length:5},(_,row)=>Array.from({length:7},(_,col)=>{const n=row*7+col;return `${String(n+1).padStart(2,'0')} · ${labels[d.connections[n]]}`;})),{styles:{fontSize:7,cellPadding:1.3},didParseCell:cell=>{if(String(cell.cell.raw).endsWith('· NC'))cell.cell.styles.fillColor=[255,227,222];}});
    pdf.setFontSize(6.5);pdf.setTextColor(...gray);pdf.text('P: pendiente    C: conforme    NC: no conforme    NA: no aplica',12,y-1);y+=4;
    table([`¿Se requiere corregir alguna conexión? ${d.needsCorrection}`],[[`Resultado: ${d.result}${d.reason?'  |  Motivo: '+d.reason:''}`]],{styles:{fontSize:8,cellPadding:1.8}});
    table(['Conexión','Responsable','Corrección','Inspector','Inspección','¿Cumple?'],d.corrections.length?d.corrections.map(r=>[text(r.connection),text(r.responsible),formatDate(r.date),text(r.inspector),formatDate(r.inspectionDate),text(r.compliant)]):[['—','—','—','—','—','—']],{styles:{fontSize:7,cellPadding:1.5}});
    table(['Equipo de medición · nombre y código','Vencimiento de calibración'],d.equipment.length?d.equipment.map(r=>[text(r.name),formatDate(r.expiry)]):[['—','—']],{styles:{fontSize:7,cellPadding:1.5}});
    if(d.recordNotes)table(['Notas del registro'],[[d.recordNotes]]);
    table(['Realizado por','Inspeccionado por'],[[text(d.recordBy),text(d.inspector)]],{styles:{fontSize:8,cellPadding:1.8}});
    approvals();
  }
  const total=pdf.getNumberOfPages();
  for(let p=1;p<=total;p++){pdf.setPage(p);pdf.setDrawColor(213,222,223);pdf.line(12,283,198,283);pdf.setTextColor(...gray);pdf.setFont('helvetica','normal');pdf.setFontSize(6.5);pdf.text('Copia impresa no controlada. Verificar la vigencia antes de su uso.',12,287);pdf.text(`${p} / ${total}`,198,287,{align:'right'});pdf.text((d.organization||'Sistema de control de la calidad').slice(0,100),12,291);pdf.text('Los nombres y estados declarados no constituyen una firma digital.',198,291,{align:'right'});}
  pdf.setProperties({title:`Plan y registro de prueba - ${d.code||'Sin código'}`,subject:'Prueba de fuga y/o estanqueidad',creator:'Plan & Prueba',author:d.organization||''});
  return pdf;
}
