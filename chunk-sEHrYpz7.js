import{n as r,r as s}from"./chunk-CCnQ1X3m.js";import"./chunk-Dqyvoa3d.js";import"./chunk-hh0W7bTI.js";import"./chunk-CPOT3Cmo.js";import"./chunk-D4k-zadY.js";import"./chunk-DEURnQ86.js";import"./chunk-CABSGZFi.js";import"./chunk-tv0E5ky_.js";import{$t as qg,Cn as yw,Dt as gm,En as zt,Et as g,F as Ol,G as Tw,K as Uf,Kt as nm,N as Nl,S as JI,Tt as fm,Ut as mm,V as Ra,Vt as mS,Xt as pS,_n as xs,a as Bg,c as Cl,dt as bb,en as rS,et as Ws,in as sw,m as Ew,pt as bw,q as Ug,qt as nr,sn as uI,ut as aw,v as Hf,vn as yE,vt as dm,w as Jw,xt as eC,z as Qg}from"./chunk-DNNweo43.js";import{r as Ta}from"./chunk-Co_RwQmQ.js";import{n as k,t as a}from"./chunk-BpdmJQ7d.js";import{a as d,f as q,u as S}from"./main-UXFGPLMT.js";import{a as M,l as X}from"./chunk-BiM_qOS_.js";import{t as B}from"./chunk-C9txRCag.js";import{d as at,o as Oe$1}from"./chunk-OenFUPh_.js";import"./chunk-Dqt6NRMF.js";import{a as q$1,r as V,t as K}from"./chunk-vW1N4ADF.js";import{t as a$1}from"./chunk-CCPKOP-2.js";import{a as s$1}from"./chunk-CId4CDmp.js";import{n as Ot,o as on,s as un,t as Ie$1}from"./chunk-oL0wvA0A.js";import{t as n}from"./chunk-BxT9_UAb.js";import{J as we,S as X$1,U as qt,t as $t,w as Y}from"./chunk-DxrpJeko.js";var Pe=14e3;var Ee=`You are an expert exam reviewer writer. Read the DOCUMENT and produce a complete exam reviewer in strict JSON \u2014 the kind a top student would write by hand to cram from.

Return JSON with exactly this shape:
{
  "title": "Main Subject \u2014 Exam Reviewer",
  "intro": "1-2 sentences: what the document covers overall.",
  "parts": [
    {
      "title": "SHORT THEME IN CAPS",
      "sections": [
        {
          "num": 1,
          "heading": "Section name",
          "stars": 3,
          "mustKnow": "VERY exam-worthy | Important | Good to know",
          "definition": "Term = one-line meaning that opens the section",
          "explanation": "2-4 sentences of plain-English explanation.",
          "terms": [
            { "term": "Sub-term name", "meaning": "Meaning: one clear line.", "bullets": ["detail \u2014 short note", "detail \u2014 short note"], "memory": "Utilitarianism = Results" }
          ],
          "bullets": ["Term \u2014 what it is", "Term \u2014 what it is"],
          "steps": ["Step name \u2014 what happens", "Step name \u2014 what happens"],
          "table": { "headers": ["Col A", "Col B"], "rows": [["a1", "b1"], ["a2", "b2"]] },
          "mnemonic": "Recognize \u2192 Gather \u2192 Identify \u2192 Consider \u2192 Generate \u2192 Evaluate \u2192 Act \u2192 Reflect",
          "important": "The one caveat students get wrong, e.g. 'Something can be legal but unethical.'",
          "example": "One concrete IT scenario from the document.",
          "memory": "Mnemonic like 'Kant = Rules/Duty' or 'U-D-V-S-R'",
          "examClue": "Likely exam phrase \u2192 answer, e.g. '"greatest number" \u2192 Utilitarianism'"
        }
      ]
    }
  ],
  "idQuestions": [
    { "clue": "Personal or cultural beliefs about right and wrong", "answer": "Morality" },
    { "clue": "Framework consisting of Privacy, Accuracy, Property, and Accessibility", "answer": "PAPA" }
  ],
  "myths": [
    { "myth": "Liking or commenting on a libelous post automatically makes you liable.", "fact": "Mere recipients/reactors are protected; the original author is the primary target." },
    { "myth": "Authorized penetration testing is illegal.", "fact": "Authorized security testing is lawful when performed within its permitted scope." }
  ],
  "gaps": [
    "Section on X was unreadable in the source \u2014 re-upload a clearer copy for coverage",
    "Topic Y appeared only as a heading with no supporting text to review"
  ],
  "finalReview": [
    "Morality = What I/our culture believe is right",
    "Utilitarianism = Outcome",
    "8 Steps = Recognize \u2192 Gather \u2192 Identify \u2192 Consider \u2192 Generate \u2192 Evaluate \u2192 Act \u2192 Reflect"
  ],
  "highYield": [
    { "label": "Topic name", "items": ["thing to memorize", "Step A \u2192 Step B \u2192 Step C"] }
  ]
}

Every field except num and heading is optional (use null or omit it), but a strong reviewer uses most of them.

RULES:
1. Cover EVERY major topic in the document, roughly in source order \u2014 do not skip or merge away content.
2. Group sections into 4-10 PARTS. A part's "title" is the short theme in CAPS only \u2014 never write the word 'PART' or a numeral, the app adds "PART <roman>" itself.
3. Number sections continuously across all parts (1, 2, 3, ...). Put "stars": 3 on the sections the exam will hammer (core lists, theories, models), 2 for supporting ones, omit for filler.
4. When a section introduces several related concepts (morality/ethics/law, the five theories, PAPA letters, attack types), use "terms": one entry per concept with "meaning" ("Meaning: ..."), optional "bullets" for its attributes (Focus/Key Question/IT Example, what shapes it), and "memory" ("Utilitarianism = Results", "PAPA = Privacy, Accuracy, Property, Accessibility").
5. Open concept sections with "definition" in the exact form "Term = meaning".
6. Use "bullets" for families of similar items: "Term \u2014 what it is", bold-worthy term first, em dash before the description.
7. Use "steps" for ordered processes: "Step name \u2014 what happens".
8. Use "table" whenever concepts contrast (morality vs ethics vs law, the five theories side by side, attacks vs CIA property). Tables beat prose for comparisons.
9. "mnemonic" is the memorize-the-order line with \u2192 arrows ("Recognize \u2192 Gather \u2192 ...") or a letter code ("U-D-V-S-R").
10. "important" flags the trap ("Something can be legal but unethical, or ethical but not legally required."). "example" is one concrete IT scenario.
11. "memory" is the section's memory trick. "examClue" maps the exact phrase the exam uses to the answer with \u2192 arrows.
12. "idQuestions" are 6-14 identification drills: "clue" describes the concept WITHOUT naming it, "answer" is the term. Pull the exam's most likely definitions.
13. "myths" are 4-8 misconception pairs the document debunks (or that students commonly get wrong about it): the \u274C myth students believe, the \u2705 fact that corrects it.
14. "gaps" \u2014 up to 5 entries naming topics/sections from the DOCUMENT you could NOT cover, could not read clearly, or covered only thinly (empty array when coverage is complete). Never invent content to fill a gap \u2014 name it.
15. "finalReview" is the one-minute cram: 6-12 lines of the form "Term = keyword" or "Model = Step A \u2192 Step B \u2192 ...".
16. "highYield" is the last-minute sheet: one entry per big topic, items as short as possible, arrow chains for sequences.
17. You MAY open a part title or term with ONE emoji when it aids scanning (\u{1F4DA}, \u{1F1F5}\u{1F1ED}, \u{1F7E6}\u2026). Use ONLY facts from the document. Do not invent content. Keep language clear and student-friendly.
18. maxOutputTokens is large \u2014 use it: be thorough, this is the student's main study material.`;function u(r){return String(r||``).replace(/\s+/g,` `).trim()}function He(r){let e=[[1e3,`M`],[900,`CM`],[500,`D`],[400,`CD`],[100,`C`],[90,`XC`],[50,`L`],[40,`XL`],[10,`X`],[9,`IX`],[5,`V`],[4,`IV`],[1,`I`]],i=``;for(let[t,n]of e)for(;r>=t;)i+=n,r-=t;return i}function Q(r,e){let i=r.indexOf(` — `);return i<1?e(r):`<b>${e(r.slice(0,i))}</b> \u2014 ${e(r.slice(i+3))}`}function Ie(r){if(!r||!Array.isArray(r.parts)||!r.parts.length)return null;let e=[],i=1;for(let s of r.parts){if(!s||!Array.isArray(s.sections)||!s.sections.length)continue;let h=[];for(let a of s.sections){let p=u(a.explanation),o=Array.isArray(a.bullets)?a.bullets.map(u).filter(Boolean):[],S=Array.isArray(a.steps)?a.steps.map(u).filter(Boolean):[],g=Array.isArray(a.terms)?a.terms.map(d=>({term:u(d?.term),meaning:u(d?.meaning).replace(/^meaning:\s*/i,``),bullets:Array.isArray(d?.bullets)?d.bullets.map(u).filter(Boolean):[],memory:u(d?.memory)||null})).filter(d=>d.term&&(d.meaning||d.bullets.length)):[];if(!p&&!o.length&&!S.length&&!g.length)continue;let T=a.table&&Array.isArray(a.table.headers)&&Array.isArray(a.table.rows)&&a.table.rows.length?{headers:a.table.headers.map(u).filter(Boolean),rows:a.table.rows.map(d=>Array.isArray(d)?d.map(u):[]).filter(d=>d.length)}:null,M=Number(a.stars);h.push({num:a.num!=null?Number(a.num):i,heading:u(a.heading)||`Section ${i}`,mustKnow:u(a.mustKnow)||null,stars:Number.isFinite(M)?Math.max(0,Math.min(3,Math.round(M))):null,definition:u(a.definition)||null,explanation:p,terms:g,bullets:o,steps:S,table:T,mnemonic:u(a.mnemonic)||null,important:u(a.important)||null,example:u(a.example)||null,memory:u(a.memory)||null,examClue:u(a.examClue)||null}),i++}if(h.length){let a=(u(s.title)||`PART`).replace(/^PART\s+[IVXLC\d]+\s*[—–-]?\s*/i,``)||`PART`;e.push({title:a,sections:h})}}if(!e.length)return null;let t=Array.isArray(r.highYield)?r.highYield.map(s=>({label:u(s?.label),items:Array.isArray(s?.items)?s.items.map(u).filter(Boolean):[]})).filter(s=>s.label&&s.items.length):[],n=Array.isArray(r.idQuestions)?r.idQuestions.map(s=>({clue:u(s?.clue),answer:u(s?.answer)})).filter(s=>s.clue&&s.answer):[],l=Array.isArray(r.myths)?r.myths.map(s=>({myth:u(s?.myth),fact:u(s?.fact)})).filter(s=>s.myth&&s.fact):[],m=Array.isArray(r.gaps)?r.gaps.map(u).filter(Boolean).slice(0,5):[],c=Array.isArray(r.finalReview)?r.finalReview.map(u).filter(Boolean):[];return{v:3,title:u(r.title)||`Exam Reviewer`,intro:u(r.intro)||``,parts:e,idQuestions:n,myths:l,gaps:m,finalReview:c,highYield:t}}function De(r){if(r.length<=Pe)return[r];let e=[],i=r.split(/\n{2,}/),t=``;for(let n of i)(t+`

`+n).length>Pe&&t?(e.push(t),t=n):t=t?t+`

`+n:n;return t&&e.push(t),e.slice(0,3)}async function Ve(r$1){let e=r$1.reviewerAI;if((Array.isArray(e)?e.length:e?.parts?.length)&&e.v===3)return{reviewer:e,cached:!0};let t=String(r$1.text||``).trim();if(t.length<300)return{error:`not_enough_content`};let n=De(t),l=null,m=-1,c=!1;for(let s=0;s<n.length&&!l;s++){let h=n.length>1?`DOCUMENT (part ${s+1} of ${n.length}):

${n[s]}

Cover only the topics in this part.`:`DOCUMENT:

${n[s]}`;try{let a=await q(`${Ee}

${h}`,{json:!0,maxOutputTokens:8e3,temperature:.3,timeoutMs:95e3}),p;try{p=JSON.parse(a)}catch{let o=a.match(/\{[\s\S]*\}/);if(o)try{p=JSON.parse(o[0])}catch{p=null}}if(l=Ie(p),l&&(m=s),!l&&n.length>1)try{l=Ie(JSON.parse(await q(`${Ee}

${h}

Return ONLY valid JSON.`,{json:!0,maxOutputTokens:8e3,temperature:.2,timeoutMs:95e3})))}catch{}}catch(a){let p=String(a?.message||a);if(p.includes(`no_keys_configured`)||p.includes(`origin_not_allowed`))return{error:`relay_unavailable`};/timeout|upstream_timeout|504|abort/i.test(p)&&(c=!0)}}if(!l)return{error:c?`timeout`:`generation_failed`};if(n.length>1){let s$2=Array.isArray(l.gaps)?l.gaps:[];s$2.unshift(`This file is long \u2014 the reviewer was built from part ${m+1} of ${n.length}; later sections may be missing.`),l=s(r({},l),{gaps:s$2.slice(0,6)})}try{await qt(r$1.id,{reviewerAI:l})}catch{}return{reviewer:l,cached:!1}}function Le(r,e){let i=e,t=[];t.push(`
    <div class="rvw-head">
      <div class="rvw-eyebrow">\u2726 AI Exam Reviewer</div>
      <h1 class="rvw-title">${i(r.title)}</h1>
      ${r.intro?`<p class="rvw-overview">${i(r.intro)}</p>`:``}
    </div>`);let n=0;for(let a of r.parts){n++;let p=(a.title||`PART`).replace(/^PART\s+[IVXLC\d]+\s*[—–-]?\s*/i,``)||`PART`;t.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">${He(n)}</span><h3>${i(p)}</h3></div>`);for(let o of a.sections){t.push(`<div class="ai-sec">`);let S=o.mustKnow?`<span class="ai-flag ${/VERY/i.test(o.mustKnow)?`hot`:/Important/i.test(o.mustKnow)?`warm`:`cool`}">${i(o.mustKnow)}</span>`:``,g=o.stars?`<span class="ai-stars">`+`⭐`.repeat(Math.min(3,o.stars))+`</span>`:``;if(t.push(`<div class="ai-sec-head"><span class="ai-num">${i(o.num)}</span><h4>${i(o.heading)}${g}</h4>${S}</div>`),o.definition){let d=o.definition.indexOf(`=`);t.push(d>0?`<p class="ai-def"><span class="ai-def-term">${i(o.definition.slice(0,d).trim())}</span> = ${i(o.definition.slice(d+1).trim())}</p>`:`<p class="ai-def">${i(o.definition)}</p>`)}o.explanation&&t.push(`<p class="ai-expl" data-para>${i(o.explanation)}</p>`);for(let d of o.terms||[]){if(t.push(`<div class="ai-term" data-para>`),t.push(`<div class="ai-term-name">\u{1F539} ${i(d.term)}</div>`),d.meaning){let V=d.meaning.replace(/^meaning:\s*/i,``);t.push(`<p class="ai-term-meaning"><span class="ai-term-label">Meaning:</span> ${i(V)}</p>`)}d.bullets&&d.bullets.length&&t.push(`<ul class="ai-bullets">${d.bullets.map(V=>`<li data-para>${Q(V,i)}</li>`).join(``)}</ul>`),d.memory&&t.push(`<div class="ai-box ai-memory"><span class="ai-box-label">Memory</span><span>${i(d.memory)}</span></div>`),t.push(`</div>`)}let T=o.bullets||[],M=o.steps||[];T.length&&t.push(`<ul class="ai-bullets">${T.map(d=>`<li data-para>${Q(d,i)}</li>`).join(``)}</ul>`),M.length&&t.push(`<ol class="ai-steps">${M.map(d=>`<li data-para>${Q(d,i)}</li>`).join(``)}</ol>`),o.table&&t.push(`<table class="ai-table"><thead><tr>${o.table.headers.map(d=>`<th>${i(d)}</th>`).join(``)}</tr></thead><tbody>${o.table.rows.map(d=>`<tr>${d.map(V=>`<td>${i(V)}</td>`).join(``)}</tr>`).join(``)}</tbody></table>`),o.mnemonic&&t.push(`<div class="ai-mnemonic" data-para><span class="ai-mnemonic-label">\u{1F9E0} Memorize</span><span>${i(o.mnemonic)}</span></div>`),o.important&&t.push(`<div class="ai-box ai-important" data-para><span class="ai-box-label">Important</span><span>${i(o.important)}</span></div>`),o.example&&t.push(`<div class="ai-box ai-example" data-para><span class="ai-box-label">Example</span><span>${i(o.example)}</span></div>`),o.memory&&t.push(`<div class="ai-box ai-memory" data-para><span class="ai-box-label">Memory trick</span><span>${i(o.memory)}</span></div>`),o.examClue&&t.push(`<div class="ai-box ai-clue" data-para><span class="ai-box-label">Exam clue</span><span>${i(o.examClue)}</span></div>`),t.push(`</div>`)}t.push(`</div>`)}let l=r.highYield||[];l.length&&t.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">\u{1F525}</span><h3>Super Important Exam Points</h3></div>
        <p class="ai-hy-intro">If you're short on study time, memorize these first:</p>
        ${l.map(a=>`
          <div class="ai-hy">
            <div class="ai-hy-label">${i(a.label)}</div>
            <ul class="ai-bullets">${a.items.map(p=>`<li data-para>${i(p)}</li>`).join(``)}</ul>
          </div>`).join(``)}
      </div>`);let m=r.idQuestions||[];m.length&&t.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">\u{1F4DD}</span><h3>Possible Identification Questions</h3></div>
        ${m.map(a=>`
          <div class="ai-idq" data-para>
            <div class="ai-idq-clue">${i(a.clue)}</div>
            <div class="ai-idq-ans">\u2192 ${i(a.answer)}</div>
          </div>`).join(``)}
      </div>`);let c=r.myths||[];c.length&&t.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">\u2696\uFE0F</span><h3>Myths vs Facts</h3></div>
        ${c.map(a=>`
          <div class="ai-myth" data-para>
            <div class="ai-myth-row bad">\u274C <span>${i(a.myth)}</span></div>
            <div class="ai-myth-row good">\u2705 <span>${i(a.fact)}</span></div>
          </div>`).join(``)}
      </div>`);let s=r.finalReview||[];s.length&&t.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">\u{1F3AF}</span><h3>One-Minute Final Review</h3></div>
        <p class="ai-hy-intro">Before your exam, remember:</p>
        ${s.map(a=>{let p=a.indexOf(`=`);return p>0?`<p class="ai-def" data-para><span class="ai-def-term">${i(a.slice(0,p).trim())}</span> = ${i(a.slice(p+1).trim())}</p>`:`<p class="ai-def" data-para>${i(a)}</p>`}).join(``)}
      </div>`);let h=r.gaps||[];return h.length&&t.push(`
      <div class="ai-gaps" data-para>
        <div class="ai-gaps-head">\u26A0\uFE0F Possibly missing from this reviewer</div>
        <ul>${h.map(a=>`<li>${i(a)}</li>`).join(``)}</ul>
      </div>`),t.push(`<p class="sum-note">AI-generated from your document — always double-check against your original source before the exam.</p>`),t.join(``)}var Oe=[`content`];function Fe(r,e){if(r&1){let i=yw();xs(0,`div`,11)(1,`button`,25),qg(`click`,function(){Uf(i);return Hf(Ew(2).setAiMode(!0))}),Ws(2,`span`,20),pS(3,`ico`),Jw(4,` AI reviewer`),Nl(),xs(5,`button`,25),qg(`click`,function(){Uf(i);return Hf(Ew(2).setAiMode(!1))}),Jw(6,`Quick notes`),Nl()()}if(r&2){let i=Ew(2);uI(),nm(`on`,i.aiMode()),uI(),Ug(`innerHTML`,mS(3,5,`sparkles`),yE),uI(3),nm(`on`,!i.aiMode())}}function je(r,e){r&1&&(xs(0,`div`,12),Ws(1,`span`,26),Jw(2,` Forging your AI reviewer from this file… usually under a minute. Quick notes shown meanwhile.`),Nl())}function ze(r,e){if(r&1){let i=yw();xs(0,`div`,13),Jw(1,`AI reviewer couldn't be generated`),xs(2,`button`,27),qg(`click`,function(){Uf(i);return Hf(Ew(2).retryAi())}),Jw(3,`Retry`),Nl(),xs(4,`button`,27),qg(`click`,function(){Uf(i);return Hf(Ew(2).byok.open(`The AI relay is busy or out of requests. Add your own free Gemini key to generate the reviewer.`))}),Jw(5,`Add a key`),Nl()()}}function Be(r,e){if(r&1){let i=yw();xs(0,`header`,2)(1,`button`,3),pS(2,`ico`),qg(`click`,function(){Uf(i);return Hf(Ew().back())}),Nl(),xs(3,`div`,4)(4,`div`,5),Jw(5),Nl(),xs(6,`div`,6),Jw(7),Nl()(),xs(8,`div`,7)(9,`button`,8),qg(`click`,function(){Uf(i);return Hf(Ew().fontMinus())}),Jw(10,`A−`),Nl(),xs(11,`button`,9),qg(`click`,function(){Uf(i);return Hf(Ew().fontPlus())}),Jw(12,`A+`),Nl()()(),xs(13,`div`,10),sw(14,Fe,7,7,`div`,11),sw(15,je,3,0,`div`,12),sw(16,ze,6,0,`div`,13),xs(17,`div`,14)(18,`input`,15),mm(`ngModelChange`,function(n){Uf(i);let l=Ew();return rS(l.findQuery,n)||(l.findQuery=n),Hf(n)}),qg(`input`,function(){Uf(i);return Hf(Ew().runFind())})(`keydown`,function(n){Uf(i);return Hf(Ew().onFindKey(n))}),Nl(),JI(),xs(19,`span`,16),Jw(20),Nl()(),Ws(21,`article`,17,0),xs(23,`div`,18)(24,`button`,19),qg(`click`,function(){Uf(i);return Hf(Ew().quizMe())}),Ws(25,`span`,20),pS(26,`ico`),Jw(27,` Quiz me on this`),Nl(),xs(28,`button`,21),qg(`click`,function(){Uf(i);return Hf(Ew().exportPdf())}),Ws(29,`span`,20),pS(30,`ico`),Jw(31),Nl(),xs(32,`div`,22)(33,`button`,23),qg(`click`,function(){Uf(i);return Hf(Ew().exportMd())}),Ws(34,`span`,20),pS(35,`ico`),Jw(36,` Export .md`),Nl(),xs(37,`button`,24),qg(`click`,function(){Uf(i);return Hf(Ew().print())}),Ws(38,`span`,20),pS(39,`ico`),Jw(40,` Print sheet`),Nl()()()()}if(r&2){let i=e,t=Ew();uI(),Ug(`innerHTML`,mS(2,19,`chevronLeft`),yE),uI(4),dm(i.name),uI(2),fm(``,t.typeLabel(i.type),` · `,i.wordCount.toLocaleString(),` words`),uI(7),aw(t.aiState()===`ready`?14:-1),uI(),aw(t.aiState()===`generating`?15:-1),uI(),aw(t.aiState()===`error`?16:-1),uI(),nm(`hidden`,!t.findVisible()),uI(),gm(`ngModel`,t.findQuery),eC(),uI(2),dm(t.findCount()),uI(),Ug(`innerHTML`,t.contentHtml(),yE),uI(4),Ug(`innerHTML`,mS(26,21,`play`),yE),uI(3),Ug(`disabled`,t.buildingPdf()||!t.reviewerReady()||t.aiMode()&&t.aiState()===`generating`),Bg(`aria-busy`,t.buildingPdf()),uI(),Ug(`innerHTML`,mS(30,23,`download`),yE),uI(2),Ol(` `,t.buildingPdf()?`Building PDF…`:t.aiMode()&&t.aiReviewer()?`Export AI Reviewer PDF`:`Export Reviewer PDF`,` `),uI(3),Ug(`innerHTML`,mS(35,25,`download`),yE),uI(4),Ug(`innerHTML`,mS(39,27,`print`),yE)}}function U(r,e=3){let i=[];for(let t=0;t<r.length;t+=e)i.push(r.slice(t,t+e));return i.map(t=>t.join(` `))}var Qe=/^(The|This|That|These|Those|It|Its|In|At|On|And|But|For|With|When|After|Today|Just|Only|Most|Many|Both|Each|Such|Then|They|There)$/;var Ne=class r$2{route=g(zt);router=g(Ra);toast=g(a);ui=g(n);typeLabel=s$1;qs=g(a$1);byok=g(d);sanitizer=g(bb);content;doc=nr(null);contentHtml=nr(``);scale=1;aiReviewer=nr(null);aiState=nr(`idle`);aiMode=nr(!0);aiTried=!1;findVisible=nr(!1);findCount=nr(``);reviewerReady=nr(!1);buildingPdf=nr(!1);nlp=null;nlpBuilding=!1;findMatches=[];findPos=-1;zoom=null;get themeIcon(){return this.ui.theme()===`dark`?`sun`:`moon`}ico(e){return k(e)}esc(e){return String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}async load(){let i=await $t(this.route.snapshot.paramMap.get(`id`)||``);if(!i){this.router.navigateByUrl(`/tabs/library`);return}this.reviewerReady.set(!1),this.doc.set(i),i.reviewerAI?.parts?.length&&(this.aiReviewer.set(i.reviewerAI),this.aiState.set(`ready`));let t=Y();this.scale=t.readerScale||1,this.aiMode.set(t.reviewerAiMode!==!1),setTimeout(()=>this.applyView(),0),this.tryGenerateAi()}ngAfterViewInit(){this.load()}buildNlp(){let e=this.doc(),i=M(e.text),t=X(e.text),n=t.topics,l=t.membership,m=B(e.text),c=[];if(n.length&&i.length){let o=new Map(n.map(g=>[g.title,[]])),S=[];for(let g of i){let T=l.get(g);T&&o.has(T)?o.get(T).push(g):S.push(g)}S.length>=2&&c.push({title:`Overview`,paras:U(S)});for(let g of n){let T=o.get(g.title);T?.length&&c.push({title:g.title,paras:U(T)})}}else c.push({title:null,paras:U(i.length?i:e.text.split(/(?<=[.!?])\s+/))});let s=[],h=new Set;for(let o of m.sections)for(let S of o.terms){let g=S.toLowerCase();if(h.has(g)||s.length>=8)continue;h.add(g);let T=i.find(M=>M.toLowerCase().includes(g)&&M.length>20);T&&s.push({term:S,def:T})}let p=(Oe$1(e,{count:6,mix:r({},at),difficulty:`medium`,shuffle:!1,fixedSeed:7}).questions||[]).filter(o=>o.type!==`short`);this.nlp={sents:i,topics:n,summary:m,sections:c,keyTermDefs:s,reviewQs:p,readTargets:{summary:m.sections.flatMap(o=>o.points),full:c.flatMap(o=>o.paras)}}}summaryHtml(){let e=this.doc(),{summary:i,sections:t,keyTermDefs:n,reviewQs:l}=this.nlp;if(!i.tldr.length)return`<div class="empty-state"><h3>Not enough to summarize</h3><p>This document has too little readable text. Try the Full text tab.</p></div>`;let m=[];return m.push(`
      <div class="rvw-head">
        <div class="rvw-eyebrow">${this.ico(`book`)} Study Reviewer</div>
        <h1 class="rvw-title">${this.esc(e.name)}</h1>
        <div class="rvw-meta">${s$1(e.type)} \xB7 ${e.wordCount.toLocaleString()} words \xB7 ${t.length} section${t.length===1?``:`s`} \xB7 ${n.length} key term${n.length===1?``:`s`}</div>
      </div>`),i.tldr.length&&m.push(`
        <div class="rvw-part">
          <div class="rvw-part-head"><span class="rvw-num">I</span><h3>Overview</h3></div>
          ${i.tldr.map(c=>`<p class="rvw-overview" data-point>${this.esc(c)}</p>`).join(``)}
        </div>`),n.length&&m.push(`
        <div class="rvw-part">
          <div class="rvw-part-head"><span class="rvw-num">II</span><h3>Key Terms &amp; Definitions</h3></div>
          <dl class="rvw-terms">
            ${n.map(c=>`<div class="rvw-term"><dt>${this.esc(c.term)}</dt><dd>${this.esc(c.def)}</dd></div>`).join(``)}
          </dl>
        </div>`),i.sections.length&&m.push(`
        <div class="rvw-part">
          <div class="rvw-part-head"><span class="rvw-num">III</span><h3>Section Notes</h3></div>
          ${i.sections.map((c,s)=>`
            <div class="sum-section">
              <div class="sum-head">
                <span class="sum-num">${String(s+1).padStart(2,`0`)}</span>
                <h4>${this.esc(c.title)}</h4>
                <span class="chip-count">${c.sentenceCount} sentence${c.sentenceCount===1?``:`s`}</span>
              </div>
              <ul class="sum-points">
                ${c.points.map(h=>`<li>${this.esc(h)}</li>`).join(``)}
              </ul>
            </div>`).join(``)}
        </div>`),l.length&&m.push(`
        <div class="rvw-part">
          <div class="rvw-part-head"><span class="rvw-num">IV</span><h3>Test Yourself</h3></div>
          <ol class="rvq-list">
            ${l.map(c=>this.selfTestItemHtml(c)).join(``)}
          </ol>
        </div>`),m.join(``)+`<p class="sum-note">Forged from your document — open <strong>Full text</strong> to read everything.</p>`}selfTestItemHtml(e){let i={tf:`TRUE or FALSE`,matching:`MATCHING`,ordering:`ORDERING`},t=``,n=``,l=``,m=(s,h=!1)=>`<div class="rvq-opts">${(s||[]).map((a,p)=>`<span>${h?p+1+`.`:String.fromCharCode(65+p)+`.`} ${this.esc(a)}</span>`).join(``)}</div>`;if(e.type===`mcq`||e.type===`except`)t=(e.type===`except`?`<span class="rvq-tag">EXCEPT</span> `:``)+this.esc(e.stem),n=m(e.options),l=e.options?.[e.answerIndex]??``;else if(e.type===`multi`)t=`<span class="rvq-tag">SELECT 2</span> `+this.esc(e.stem),n=m(e.options),l=(e.answerIndices||[]).map(s=>e.options?.[s]).filter(Boolean).join(` · `);else if(e.type===`tf`)t=`<span class="rvq-tag">T/F</span> ${this.esc(e.statement)}`,l=e.answer?`True`:`False`;else if(e.type===`fib`)t=this.esc(e.stem),n=m(e.choices,!0),l=e.choices?.[e.answerIndex]??``;else if(e.type===`id`)t=`Identify the term: ${this.esc(e.clue)}`,l=e.answer??``;else if(e.type===`matching`)t=`${this.esc(e.prompt)}`,n=`
        <div class="rvq-opts rvq-match">
          <div class="rvq-match-col"><b>Terms</b>${(e.pairs||[]).map(s=>`<span>${this.esc(s.left)}</span>`).join(``)}</div>
          <div class="rvq-match-col"><b>Definitions</b>${(e.rightOrder||[]).map(s=>`<span>${this.esc(e.pairs?.[s]?.right||``)}</span>`).join(``)}</div>
        </div>`,l=(e.pairs||[]).map(s=>`${s.left} \u2192 ${s.right}`).join(` · `);else if(e.type===`ordering`)t=`${this.esc(e.prompt)}`,n=m(e.shuffled||e.steps,!0),l=(e.steps||[]).map((s,h)=>`${h+1}. ${s}`).join(`  ·  `);else return``;return`<li class="rvq">
      <div class="rvq-q">${i[e.type]?`<span class="rvq-tag">${i[e.type]}</span> `:``}${t}${n}</div>
      <details class="rvq-reveal"><summary>Check answer</summary><span>${this.esc(l)}</span></details>
    </li>`}fullHtml(){return this.nlp.sections.map(e=>`
      <section class="reader-section">
        ${e.title?`<h2>${this.esc(e.title)}</h2>`:``}
        ${e.paras.map(i=>`<p data-para>${this.esc(i)}</p>`).join(``)}
      </section>`).join(``)+`<p class="reader-end">· · ·</p>`}trust(e){return this.sanitizer.bypassSecurityTrustHtml(e)}aiReviewHtml(){return Le(this.aiReviewer(),e=>this.esc(e))}async tryGenerateAi(){if(this.aiTried||this.aiState()===`ready`)return;this.aiTried=!0;let e=this.doc();if(!e?.text||String(e.text).trim().length<300)return;this.aiState.set(`generating`);let i=await Ve(e);if(i.reviewer)this.aiReviewer.set(i.reviewer),this.aiState.set(`ready`),this.byok.notifyAiOk();else if(i.error!==`not_enough_content`)this.aiState.set(`error`),this.byok.notifyAiFailure(i.error||`error`);else{this.aiState.set(`idle`);return}this.applyView()}retryAi(){this.aiState()!==`generating`&&(this.aiTried=!1,this.aiState.set(`idle`),this.tryGenerateAi())}setAiMode(e){this.aiMode.set(e),X$1({reviewerAiMode:e}),this.applyView()}applyView(){let e=this.content?.nativeElement;if(!e)return;let i=e.closest(`.rev-screen`)?.querySelector(`.font-controls`);if(!this.nlp){this.contentHtml.set(this.trust(`<div class="reader-loading">Preparing your document…</div>`)),this.nlpBuilding||(this.nlpBuilding=!0,setTimeout(()=>{this.buildNlp(),this.nlpBuilding=!1,this.applyView()},0));return}this.contentHtml.set(this.trust(this.aiMode()&&this.aiReviewer()?this.aiReviewHtml():this.summaryHtml())),this.reviewerReady.set(!0),e.classList.add(`summary-mode`),i&&(i.style.visibility=`hidden`),this.clearFind()}findQuery=``;clearFind(){this.findMatches=[],this.findPos=-1,this.findCount.set(``),this.content?.nativeElement?.querySelectorAll(`mark.find-hit, mark.find-current`).forEach(i=>{let t=i.parentNode;t.replaceChild(document.createTextNode(i.textContent||``),i),t.normalize()})}runFind(){this.clearFind();let e=this.findQuery.trim();if(e.length<2)return;let i=this.content.nativeElement,t=document.createTreeWalker(i,NodeFilter.SHOW_TEXT),n=[];for(;t.nextNode();){let l=t.currentNode;l.nodeValue&&l.nodeValue.toLowerCase().includes(e.toLowerCase())&&n.push(l)}for(let l of n){let m=l.nodeValue||``,c=document.createDocumentFragment(),s=0,h=m.toLowerCase(),a=h.indexOf(e.toLowerCase());for(;a!==-1;){c.appendChild(document.createTextNode(m.slice(s,a)));let p=document.createElement(`mark`);p.className=`find-hit`,p.textContent=m.slice(a,a+e.length),c.appendChild(p),this.findMatches.push(p),s=a+e.length,a=h.indexOf(e.toLowerCase(),s)}c.appendChild(document.createTextNode(m.slice(s))),l.parentNode.replaceChild(c,l)}this.stepFind(0)}onFindKey(e){e.key===`Enter`&&(e.preventDefault(),this.stepFind(e.shiftKey?-1:1)),e.key===`Escape`&&(this.findQuery=``,this.clearFind())}stepFind(e){if(!this.findMatches.length){this.findCount.set(`0/0`);return}this.findPos=e===0?0:(this.findPos+e+this.findMatches.length)%this.findMatches.length,this.findMatches.forEach((i,t)=>i.classList.toggle(`find-current`,t===this.findPos)),this.findCount.set(`${this.findPos+1}/${this.findMatches.length}`),this.findMatches[this.findPos]?.scrollIntoView({block:`center`,behavior:`smooth`})}attachSaveOnPress(){let e=this.content?.nativeElement;e&&e.querySelectorAll(`[data-para]`).forEach(i=>{let t=i,n=null,l=null,m=s=>{s.pointerType===`mouse`&&s.button!==0||(l=null,n=setTimeout(async()=>{l=t;try{let h=(t.textContent||``).trim().slice(0,300),a=this.nlp.keyTermDefs.find(p=>h.toLowerCase().includes(p.term.toLowerCase()))?.term||this.firstKeyPhrase(h);await we({docId:this.doc().id,sentence:h,term:a,type:`note`}),t.classList.add(`saved-flash`),setTimeout(()=>t.classList.remove(`saved-flash`),900),this.toast.toast(`Saved to your review deck ✦`)}catch{this.toast.toast(`Could not save this line`,!0)}},550))},c=()=>{l===null&&clearTimeout(n)};t.addEventListener(`pointerdown`,m),t.addEventListener(`pointerup`,c),t.addEventListener(`pointerleave`,c),t.addEventListener(`pointercancel`,c)})}firstKeyPhrase(e){let i=e.split(/\s+/).slice(0,6);for(let t=0;t<Math.min(3,i.length);t++){let n=i.slice(t).join(` `).match(/^([A-Z][a-zA-Z'’-]+(?:\s+(?:of|the|de|van|von|da)?[A-Z][a-zA-Z'’-]+)*)/);if(n&&n[1].length>3&&!Qe.test(n[1].split(` `)[0]))return n[1].split(` `).slice(0,3).join(` `)}return i.slice(0,4).join(` `)}applyScale(){this.content&&(this.content.nativeElement.style.fontSize=(15*this.scale).toFixed(1)+`px`)}fontMinus(){this.scale=Math.max(.85,+(this.scale-.1).toFixed(2)),X$1({readerScale:this.scale}),this.applyScale()}fontPlus(){this.scale=Math.min(1.5,+(this.scale+.1).toFixed(2)),X$1({readerScale:this.scale}),this.applyScale()}quizMe(){this.qs.currentDocId.set(this.doc().id),this.router.navigate([`/doc`,this.doc().id,`setup`])}back(){this.router.navigate([`/doc`,this.doc().id])}exportMd(){V(this.doc()),this.toast.toast(`Downloaded study sheet (.md)`)}async exportPdf(){let e=this.content?.nativeElement;if(!(this.buildingPdf()||!e||!this.reviewerReady())){this.buildingPdf.set(!0);try{await q$1(e,this.doc().name),this.toast.toast(`Reviewer PDF downloaded ✓`)}catch{this.toast.toast(`Could not build the PDF`,!0)}finally{this.buildingPdf.set(!1)}}}print(){K(this.doc())||this.toast.toast(`Allow pop-ups to print`)}static ɵfac=function(i){return new(i||r$2)};static ɵcmp=Cl({type:r$2,selectors:[[`app-reviewer`]],viewQuery:function(i,t){if(i&1&&Qg(Oe,5),i&2){let n;bw(n=Tw())&&(t.content=n.first)}},decls:2,vars:2,consts:[[`content`,``],[3,`fullscreen`],[1,`back-header`],[`data-tooltip`,`Back`,1,`icon-btn`,3,`click`,`innerHTML`],[2,`flex`,`1`,`min-width`,`0`],[2,`font-size`,`14px`,`font-weight`,`600`,`white-space`,`nowrap`,`overflow`,`hidden`,`text-overflow`,`ellipsis`],[2,`font-size`,`11.5px`,`color`,`var(--text-faint)`],[1,`font-controls`,2,`display`,`flex`,`gap`,`4px`],[`data-tooltip`,`Smaller text`,1,`icon-btn`,`text-btn`,3,`click`],[`data-tooltip`,`Larger text`,1,`icon-btn`,`text-btn`,3,`click`],[1,`screen`,`rev-screen`],[1,`ai-mode-toggle`],[1,`ai-gen-bar`],[1,`ai-gen-bar`,`err`],[1,`find-bar`],[`type`,`search`,`placeholder`,`Find in document…`,`aria-label`,`Find in document`,`autocomplete`,`off`,1,`text-input`,3,`ngModelChange`,`input`,`keydown`,`ngModel`],[1,`faint`],[`id`,`review-content`,1,`reader`,`summary-mode`,3,`innerHTML`],[1,`reader-actions`],[1,`btn`,`btn-primary`,3,`click`],[3,`innerHTML`],[`data-tooltip`,`Download the exact Reviewer shown on screen as a PDF`,1,`btn`,`btn-primary`,2,`margin-top`,`10px`,`width`,`100%`,3,`click`,`disabled`],[2,`display`,`grid`,`grid-template-columns`,`1fr 1fr`,`gap`,`8px`,`width`,`100%`,`margin-top`,`10px`],[`data-tooltip`,`Download the study sheet as Markdown`,1,`btn`,`btn-secondary`,3,`click`],[`data-tooltip`,`Open a printable study sheet`,1,`btn`,`btn-secondary`,3,`click`],[`type`,`button`,3,`click`],[1,`ai-dot`],[`type`,`button`,1,`ai-retry`,3,`click`]],template:function(i,t){if(i&1&&(xs(0,`ion-content`,1),sw(1,Be,41,29),Nl()),i&2){let n;Ug(`fullscreen`,!0),uI(),aw((n=t.doc())?1:-1,n)}},dependencies:[Ta,un,Ie$1,on,Ot,S],encapsulation:2})};export{Ne as ReviewerPage};