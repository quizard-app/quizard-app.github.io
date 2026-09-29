var m=null;async function d(r){if(!m){m=await import(`./chunk-Dm5w_Vk12.js`);let n=`pdf.worker.min.mjs`;m.GlobalWorkerOptions.workerSrc=n}let t=await r.arrayBuffer(),e=m.getDocument({data:t,isEvalSupported:!1,disableFontFace:!0,useSystemFonts:!0}),i=await e.promise,o=[],c=i.numPages;for(let n=1;n<=c;n++){let l=await i.getPage(n),f=await l.getTextContent(),s=``;for(let p of f.items)p.str&&(s&&!s.endsWith(` `)&&!p.str.startsWith(` `)&&(s+=` `),s+=p.str,p.hasEOL&&(s+=`
`));s.trim()&&o.push({num:n,text:s.trim()}),l.cleanup()}await e.destroy();let a=o.map(n=>`=== Page ${n.num} ===
${n.text}`).join(`

`);if(!a.trim())throw new Error(`No selectable text found. This PDF may be a scanned image.`);return`PDF document, ${c} page${c>1?`s`:``}.

`+a}async function x(r){let t=(await import(`./chunk-Be9HVIZ72.js`)).default,e=await r.arrayBuffer(),o=(await t.extractRawText({arrayBuffer:e})).value||``;if(!o.trim())throw new Error(`This document appears to be empty.`);return o}var u=null;function y(r){return r.replace(/&lt;/g,`<`).replace(/&gt;/g,`>`).replace(/&quot;/g,`"`).replace(/&apos;/g,`'`).replace(/&#(\d+);/g,(t,e)=>String.fromCharCode(parseInt(e,10))).replace(/&amp;/g,`&`)}async function g(r){u||(u=(await import(`./chunk-DJJv5usP.js`)).default);let t=await r.arrayBuffer(),e=await u.loadAsync(t),i=Object.keys(e.files).filter(a=>/^ppt\/slides\/slide\d+\.xml$/.test(a)).sort((a,n)=>{return parseInt(a.match(/slide(\d+)\.xml/)[1],10)-parseInt(n.match(/slide(\d+)\.xml/)[1],10)});if(!i.length)throw new Error(`No slides found in this presentation.`);let o=[];for(let a of i){let n=parseInt(a.match(/slide(\d+)\.xml/)[1],10),s=(await e.files[a].async(`string`)).split(`</a:p>`).map(p=>[...p.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(w=>y(w[1])).join(``).trim()).filter(Boolean);s.length&&o.push({num:n,text:s.join(`
`)})}let c=o.map(a=>`=== Slide ${a.num} ===
${a.text}`).join(`

`);if(!c.trim())throw new Error(`Could not find any text in these slides.`);return`Presentation with ${o.length} slide${o.length>1?`s`:``}.

`+c}function P(r){let t=r.toLowerCase().split(`.`).pop();return t===`pdf`?`pdf`:t===`docx`?`docx`:t===`pptx`?`pptx`:t===`txt`?`txt`:t===`md`||t===`markdown`?`md`:null}async function j(r){let t=P(r.name);if(!t)throw new Error(`Unsupported file type. Please use PDF, DOCX, PPTX, TXT or MD files.`);let e;return t===`txt`||t===`md`?(e=await r.text(),t===`md`&&(e=e.replace(/^#{1,6}\s+/gm,``).replace(/\*\*([^*]+)\*\*/g,`$1`).replace(/\*([^*]+)\*/g,`$1`).replace(/`([^`]+)`/g,`$1`).replace(/\[([^\]]+)\]\([^)]*\)/g,`$1`))):e=await{pdf:d,docx:x,pptx:g}[t](r),e=e.replace(/(\w)-\n(\w)/g,`$1$2`).replace(/[ \t]+/g,` `).replace(/ ?\n ?/g,`
`).replace(/\n{3,}/g,`

`).trim(),{type:t,text:e}}export{j as n,P as t};