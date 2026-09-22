import{n as r,r as s}from"./chunk-CCnQ1X3m.js";import"./chunk-Dqyvoa3d.js";import"./chunk-hh0W7bTI.js";import"./chunk-BiSSwPEG.js";import"./chunk-D4k-zadY.js";import"./chunk-DEURnQ86.js";import"./chunk-CABSGZFi.js";import"./chunk-tv0E5ky_.js";import{$t as qg,Cn as yw,Dt as gm,En as zt,Et as g,G as Tw,K as Uf,Kt as nm,N as Nl,S as JI,Tt as fm,Ut as mm,V as Ra,Vt as mS,Xt as pS,_n as xs,c as Cl,dt as bb,en as rS,et as Ws,in as sw,m as Ew,pt as bw,q as Ug,qt as nr,sn as uI,ut as aw,v as Hf,vn as yE,vt as dm,w as Jw,xt as eC,z as Qg}from"./chunk-DNNweo43.js";import{t as Gs}from"./chunk-CcTiXij3.js";import{n as s$1,t as k}from"./chunk-BhuekSqN.js";import{d as q,i as d,l as T}from"./main-EUW3EIRP.js";import{a as M,l as X}from"./chunk-BiM_qOS_.js";import{d as at,o as Oe$1}from"./chunk-OenFUPh_.js";import"./chunk-Dqt6NRMF.js";import{a as s$2}from"./chunk-CId4CDmp.js";import{t as n}from"./chunk-BxT9_UAb.js";import{A as ce,h as Q$1,l as Lt,w as Y,y as Ut}from"./chunk-CjAev84X.js";import{t as a}from"./chunk-CCPKOP-2.js";import{n as Ot,o as on,s as un,t as Ie$1}from"./chunk-oL0wvA0A.js";import{t as B}from"./chunk-C9txRCag.js";import{i as R,r as O,t as H}from"./chunk-bzLy-r8c2.js";var ke=14e3;var Re=`You are an expert exam reviewer writer. Read the DOCUMENT and produce a complete exam reviewer in strict JSON \u2014 the kind a top student would write by hand to cram from.

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
18. maxOutputTokens is large \u2014 use it: be thorough, this is the student's main study material.`;function u(r){return String(r||``).replace(/\s+/g,` `).trim()}function Le(r){let t=[[1e3,`M`],[900,`CM`],[500,`D`],[400,`CD`],[100,`C`],[90,`XC`],[50,`L`],[40,`XL`],[10,`X`],[9,`IX`],[5,`V`],[4,`IV`],[1,`I`]],e=``;for(let[i,n]of t)for(;r>=i;)e+=n,r-=i;return e}function Q(r,t){let e=r.indexOf(` — `);return e<1?t(r):`<b>${t(r.slice(0,e))}</b> \u2014 ${t(r.slice(e+3))}`}function Pe(r){if(!r||!Array.isArray(r.parts)||!r.parts.length)return null;let t=[],e=1;for(let s of r.parts){if(!s||!Array.isArray(s.sections)||!s.sections.length)continue;let h=[];for(let a of s.sections){let d=u(a.explanation),o=Array.isArray(a.bullets)?a.bullets.map(u).filter(Boolean):[],S=Array.isArray(a.steps)?a.steps.map(u).filter(Boolean):[],g=Array.isArray(a.terms)?a.terms.map(p=>({term:u(p?.term),meaning:u(p?.meaning).replace(/^meaning:\s*/i,``),bullets:Array.isArray(p?.bullets)?p.bullets.map(u).filter(Boolean):[],memory:u(p?.memory)||null})).filter(p=>p.term&&(p.meaning||p.bullets.length)):[];if(!d&&!o.length&&!S.length&&!g.length)continue;let T=a.table&&Array.isArray(a.table.headers)&&Array.isArray(a.table.rows)&&a.table.rows.length?{headers:a.table.headers.map(u).filter(Boolean),rows:a.table.rows.map(p=>Array.isArray(p)?p.map(u):[]).filter(p=>p.length)}:null,$=Number(a.stars);h.push({num:a.num!=null?Number(a.num):e,heading:u(a.heading)||`Section ${e}`,mustKnow:u(a.mustKnow)||null,stars:Number.isFinite($)?Math.max(0,Math.min(3,Math.round($))):null,definition:u(a.definition)||null,explanation:d,terms:g,bullets:o,steps:S,table:T,mnemonic:u(a.mnemonic)||null,important:u(a.important)||null,example:u(a.example)||null,memory:u(a.memory)||null,examClue:u(a.examClue)||null}),e++}if(h.length){let a=(u(s.title)||`PART`).replace(/^PART\s+[IVXLC\d]+\s*[—–-]?\s*/i,``)||`PART`;t.push({title:a,sections:h})}}if(!t.length)return null;let i=Array.isArray(r.highYield)?r.highYield.map(s=>({label:u(s?.label),items:Array.isArray(s?.items)?s.items.map(u).filter(Boolean):[]})).filter(s=>s.label&&s.items.length):[],n=Array.isArray(r.idQuestions)?r.idQuestions.map(s=>({clue:u(s?.clue),answer:u(s?.answer)})).filter(s=>s.clue&&s.answer):[],l=Array.isArray(r.myths)?r.myths.map(s=>({myth:u(s?.myth),fact:u(s?.fact)})).filter(s=>s.myth&&s.fact):[],m=Array.isArray(r.gaps)?r.gaps.map(u).filter(Boolean).slice(0,5):[],c=Array.isArray(r.finalReview)?r.finalReview.map(u).filter(Boolean):[];return{v:3,title:u(r.title)||`Exam Reviewer`,intro:u(r.intro)||``,parts:t,idQuestions:n,myths:l,gaps:m,finalReview:c,highYield:i}}function He(r){if(r.length<=ke)return[r];let t=[],e=r.split(/\n{2,}/),i=``;for(let n of e)(i+`

`+n).length>ke&&i?(t.push(i),i=n):i=i?i+`

`+n:n;return i&&t.push(i),t.slice(0,3)}async function Ee(r$1){let t=r$1.reviewerAI;if((Array.isArray(t)?t.length:t?.parts?.length)&&t.v===3)return{reviewer:t,cached:!0};let i=String(r$1.text||``).trim();if(i.length<300)return{error:`not_enough_content`};let n=He(i),l=null,m=-1,c=!1;for(let s=0;s<n.length&&!l;s++){let h=n.length>1?`DOCUMENT (part ${s+1} of ${n.length}):

${n[s]}

Cover only the topics in this part.`:`DOCUMENT:

${n[s]}`;try{let a=await q(`${Re}

${h}`,{json:!0,maxOutputTokens:8e3,temperature:.3,timeoutMs:95e3}),d;try{d=JSON.parse(a)}catch{let o=a.match(/\{[\s\S]*\}/);if(o)try{d=JSON.parse(o[0])}catch{d=null}}if(l=Pe(d),l&&(m=s),!l&&n.length>1)try{l=Pe(JSON.parse(await q(`${Re}

${h}

Return ONLY valid JSON.`,{json:!0,maxOutputTokens:8e3,temperature:.2,timeoutMs:95e3})))}catch{}}catch(a){let d=String(a?.message||a);if(d.includes(`no_keys_configured`)||d.includes(`origin_not_allowed`))return{error:`relay_unavailable`};/timeout|upstream_timeout|504|abort/i.test(d)&&(c=!0)}}if(!l)return{error:c?`timeout`:`generation_failed`};if(n.length>1){let s$3=Array.isArray(l.gaps)?l.gaps:[];s$3.unshift(`This file is long \u2014 the reviewer was built from part ${m+1} of ${n.length}; later sections may be missing.`),l=s(r({},l),{gaps:s$3.slice(0,6)})}try{await Ut(r$1.id,{reviewerAI:l})}catch{}return{reviewer:l,cached:!1}}function Ie(r,t){let e=t,i=[];i.push(`
    <div class="rvw-head">
      <div class="rvw-eyebrow">\u2726 AI Exam Reviewer</div>
      <h1 class="rvw-title">${e(r.title)}</h1>
      ${r.intro?`<p class="rvw-overview">${e(r.intro)}</p>`:``}
    </div>`);let n=0;for(let a of r.parts){n++;let d=(a.title||`PART`).replace(/^PART\s+[IVXLC\d]+\s*[—–-]?\s*/i,``)||`PART`;i.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">${Le(n)}</span><h3>${e(d)}</h3></div>`);for(let o of a.sections){i.push(`<div class="ai-sec">`);let S=o.mustKnow?`<span class="ai-flag ${/VERY/i.test(o.mustKnow)?`hot`:/Important/i.test(o.mustKnow)?`warm`:`cool`}">${e(o.mustKnow)}</span>`:``,g=o.stars?`<span class="ai-stars">`+`⭐`.repeat(Math.min(3,o.stars))+`</span>`:``;if(i.push(`<div class="ai-sec-head"><span class="ai-num">${e(o.num)}</span><h4>${e(o.heading)}${g}</h4>${S}</div>`),o.definition){let p=o.definition.indexOf(`=`);i.push(p>0?`<p class="ai-def"><span class="ai-def-term">${e(o.definition.slice(0,p).trim())}</span> = ${e(o.definition.slice(p+1).trim())}</p>`:`<p class="ai-def">${e(o.definition)}</p>`)}o.explanation&&i.push(`<p class="ai-expl" data-para>${e(o.explanation)}</p>`);for(let p of o.terms||[]){if(i.push(`<div class="ai-term" data-para>`),i.push(`<div class="ai-term-name">\u{1F539} ${e(p.term)}</div>`),p.meaning){let V=p.meaning.replace(/^meaning:\s*/i,``);i.push(`<p class="ai-term-meaning"><span class="ai-term-label">Meaning:</span> ${e(V)}</p>`)}p.bullets&&p.bullets.length&&i.push(`<ul class="ai-bullets">${p.bullets.map(V=>`<li data-para>${Q(V,e)}</li>`).join(``)}</ul>`),p.memory&&i.push(`<div class="ai-box ai-memory"><span class="ai-box-label">Memory</span><span>${e(p.memory)}</span></div>`),i.push(`</div>`)}let T=o.bullets||[],$=o.steps||[];T.length&&i.push(`<ul class="ai-bullets">${T.map(p=>`<li data-para>${Q(p,e)}</li>`).join(``)}</ul>`),$.length&&i.push(`<ol class="ai-steps">${$.map(p=>`<li data-para>${Q(p,e)}</li>`).join(``)}</ol>`),o.table&&i.push(`<table class="ai-table"><thead><tr>${o.table.headers.map(p=>`<th>${e(p)}</th>`).join(``)}</tr></thead><tbody>${o.table.rows.map(p=>`<tr>${p.map(V=>`<td>${e(V)}</td>`).join(``)}</tr>`).join(``)}</tbody></table>`),o.mnemonic&&i.push(`<div class="ai-mnemonic" data-para><span class="ai-mnemonic-label">\u{1F9E0} Memorize</span><span>${e(o.mnemonic)}</span></div>`),o.important&&i.push(`<div class="ai-box ai-important" data-para><span class="ai-box-label">Important</span><span>${e(o.important)}</span></div>`),o.example&&i.push(`<div class="ai-box ai-example" data-para><span class="ai-box-label">Example</span><span>${e(o.example)}</span></div>`),o.memory&&i.push(`<div class="ai-box ai-memory" data-para><span class="ai-box-label">Memory trick</span><span>${e(o.memory)}</span></div>`),o.examClue&&i.push(`<div class="ai-box ai-clue" data-para><span class="ai-box-label">Exam clue</span><span>${e(o.examClue)}</span></div>`),i.push(`</div>`)}i.push(`</div>`)}let l=r.highYield||[];l.length&&i.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">\u{1F525}</span><h3>Super Important Exam Points</h3></div>
        <p class="ai-hy-intro">If you're short on study time, memorize these first:</p>
        ${l.map(a=>`
          <div class="ai-hy">
            <div class="ai-hy-label">${e(a.label)}</div>
            <ul class="ai-bullets">${a.items.map(d=>`<li data-para>${e(d)}</li>`).join(``)}</ul>
          </div>`).join(``)}
      </div>`);let m=r.idQuestions||[];m.length&&i.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">\u{1F4DD}</span><h3>Possible Identification Questions</h3></div>
        ${m.map(a=>`
          <div class="ai-idq" data-para>
            <div class="ai-idq-clue">${e(a.clue)}</div>
            <div class="ai-idq-ans">\u2192 ${e(a.answer)}</div>
          </div>`).join(``)}
      </div>`);let c=r.myths||[];c.length&&i.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">\u2696\uFE0F</span><h3>Myths vs Facts</h3></div>
        ${c.map(a=>`
          <div class="ai-myth" data-para>
            <div class="ai-myth-row bad">\u274C <span>${e(a.myth)}</span></div>
            <div class="ai-myth-row good">\u2705 <span>${e(a.fact)}</span></div>
          </div>`).join(``)}
      </div>`);let s=r.finalReview||[];s.length&&i.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">\u{1F3AF}</span><h3>One-Minute Final Review</h3></div>
        <p class="ai-hy-intro">Before your exam, remember:</p>
        ${s.map(a=>{let d=a.indexOf(`=`);return d>0?`<p class="ai-def" data-para><span class="ai-def-term">${e(a.slice(0,d).trim())}</span> = ${e(a.slice(d+1).trim())}</p>`:`<p class="ai-def" data-para>${e(a)}</p>`}).join(``)}
      </div>`);let h=r.gaps||[];return h.length&&i.push(`
      <div class="ai-gaps" data-para>
        <div class="ai-gaps-head">\u26A0\uFE0F Possibly missing from this reviewer</div>
        <ul>${h.map(a=>`<li>${e(a)}</li>`).join(``)}</ul>
      </div>`),i.push(`<p class="sum-note">AI-generated from your document — always double-check against your original source before the exam.</p>`),i.join(``)}var Ne=[`content`];function Oe(r,t){if(r&1){let e=yw();xs(0,`div`,11)(1,`button`,25),qg(`click`,function(){Uf(e);return Hf(Ew(2).setAiMode(!0))}),Ws(2,`span`,20),pS(3,`ico`),Jw(4,` AI reviewer`),Nl(),xs(5,`button`,25),qg(`click`,function(){Uf(e);return Hf(Ew(2).setAiMode(!1))}),Jw(6,`Quick notes`),Nl()()}if(r&2){let e=Ew(2);uI(),nm(`on`,e.aiMode()),uI(),Ug(`innerHTML`,mS(3,5,`sparkles`),yE),uI(3),nm(`on`,!e.aiMode())}}function De(r,t){r&1&&(xs(0,`div`,12),Ws(1,`span`,26),Jw(2,` Forging your AI reviewer from this file… usually under a minute. Quick notes shown meanwhile.`),Nl())}function Fe(r,t){if(r&1){let e=yw();xs(0,`div`,13),Jw(1,`AI reviewer couldn't be generated`),xs(2,`button`,27),qg(`click`,function(){Uf(e);return Hf(Ew(2).retryAi())}),Jw(3,`Retry`),Nl(),xs(4,`button`,27),qg(`click`,function(){Uf(e);return Hf(Ew(2).byok.open(`The AI relay is busy or out of requests. Add your own free Gemini key to generate the reviewer.`))}),Jw(5,`Add a key`),Nl()()}}function je(r,t){if(r&1){let e=yw();xs(0,`header`,2)(1,`button`,3),pS(2,`ico`),qg(`click`,function(){Uf(e);return Hf(Ew().back())}),Nl(),xs(3,`div`,4)(4,`div`,5),Jw(5),Nl(),xs(6,`div`,6),Jw(7),Nl()(),xs(8,`div`,7)(9,`button`,8),qg(`click`,function(){Uf(e);return Hf(Ew().fontMinus())}),Jw(10,`A−`),Nl(),xs(11,`button`,9),qg(`click`,function(){Uf(e);return Hf(Ew().fontPlus())}),Jw(12,`A+`),Nl()()(),xs(13,`div`,10),sw(14,Oe,7,7,`div`,11),sw(15,De,3,0,`div`,12),sw(16,Fe,6,0,`div`,13),xs(17,`div`,14)(18,`input`,15),mm(`ngModelChange`,function(n){Uf(e);let l=Ew();return rS(l.findQuery,n)||(l.findQuery=n),Hf(n)}),qg(`input`,function(){Uf(e);return Hf(Ew().runFind())})(`keydown`,function(n){Uf(e);return Hf(Ew().onFindKey(n))}),Nl(),JI(),xs(19,`span`,16),Jw(20),Nl()(),Ws(21,`article`,17,0),xs(23,`div`,18)(24,`button`,19),qg(`click`,function(){Uf(e);return Hf(Ew().quizMe())}),Ws(25,`span`,20),pS(26,`ico`),Jw(27,` Quiz me on this`),Nl(),xs(28,`button`,21),qg(`click`,function(){Uf(e);return Hf(Ew().exportPdf())}),Ws(29,`span`,20),pS(30,`ico`),Jw(31,` Export PDF handout`),Nl(),xs(32,`div`,22)(33,`button`,23),qg(`click`,function(){Uf(e);return Hf(Ew().exportMd())}),Ws(34,`span`,20),pS(35,`ico`),Jw(36,` Export .md`),Nl(),xs(37,`button`,24),qg(`click`,function(){Uf(e);return Hf(Ew().print())}),Ws(38,`span`,20),pS(39,`ico`),Jw(40,` Print sheet`),Nl()()()()}if(r&2){let e=t,i=Ew();uI(),Ug(`innerHTML`,mS(2,16,`chevronLeft`),yE),uI(4),dm(e.name),uI(2),fm(``,i.typeLabel(e.type),` · `,e.wordCount.toLocaleString(),` words`),uI(7),aw(i.aiState()===`ready`?14:-1),uI(),aw(i.aiState()===`generating`?15:-1),uI(),aw(i.aiState()===`error`?16:-1),uI(),nm(`hidden`,!i.findVisible()),uI(),gm(`ngModel`,i.findQuery),eC(),uI(2),dm(i.findCount()),uI(),Ug(`innerHTML`,i.contentHtml(),yE),uI(4),Ug(`innerHTML`,mS(26,18,`play`),yE),uI(4),Ug(`innerHTML`,mS(30,20,`download`),yE),uI(5),Ug(`innerHTML`,mS(35,22,`download`),yE),uI(4),Ug(`innerHTML`,mS(39,24,`print`),yE)}}function U(r,t=3){let e=[];for(let i=0;i<r.length;i+=t)e.push(r.slice(i,i+t));return e.map(i=>i.join(` `))}var ze=/^(The|This|That|These|Those|It|Its|In|At|On|And|But|For|With|When|After|Today|Just|Only|Most|Many|Both|Each|Such|Then|They|There)$/;var Ve=class r$2{route=g(zt);router=g(Ra);toast=g(s$1);ui=g(n);typeLabel=s$2;qs=g(a);byok=g(d);sanitizer=g(bb);content;doc=nr(null);contentHtml=nr(``);scale=1;aiReviewer=nr(null);aiState=nr(`idle`);aiMode=nr(!0);aiTried=!1;findVisible=nr(!1);findCount=nr(``);nlp=null;nlpBuilding=!1;findMatches=[];findPos=-1;zoom=null;get themeIcon(){return this.ui.theme()===`dark`?`sun`:`moon`}ico(t){return k(t)}esc(t){return String(t).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}async load(){let e=await Lt(this.route.snapshot.paramMap.get(`id`)||``);if(!e){this.router.navigateByUrl(`/tabs/library`);return}this.doc.set(e),e.reviewerAI?.parts?.length&&(this.aiReviewer.set(e.reviewerAI),this.aiState.set(`ready`));let i=Q$1();this.scale=i.readerScale||1,this.aiMode.set(i.reviewerAiMode!==!1),setTimeout(()=>this.applyView(),0),this.tryGenerateAi()}ngAfterViewInit(){this.load()}buildNlp(){let t=this.doc(),e=M(t.text),i=X(t.text),n=i.topics,l=i.membership,m=B(t.text),c=[];if(n.length&&e.length){let o=new Map(n.map(g=>[g.title,[]])),S=[];for(let g of e){let T=l.get(g);T&&o.has(T)?o.get(T).push(g):S.push(g)}S.length>=2&&c.push({title:`Overview`,paras:U(S)});for(let g of n){let T=o.get(g.title);T?.length&&c.push({title:g.title,paras:U(T)})}}else c.push({title:null,paras:U(e.length?e:t.text.split(/(?<=[.!?])\s+/))});let s=[],h=new Set;for(let o of m.sections)for(let S of o.terms){let g=S.toLowerCase();if(h.has(g)||s.length>=8)continue;h.add(g);let T=e.find($=>$.toLowerCase().includes(g)&&$.length>20);T&&s.push({term:S,def:T})}let d=(Oe$1(t,{count:6,mix:r({},at),difficulty:`medium`,shuffle:!1,fixedSeed:7}).questions||[]).filter(o=>o.type!==`short`);this.nlp={sents:e,topics:n,summary:m,sections:c,keyTermDefs:s,reviewQs:d,readTargets:{summary:m.sections.flatMap(o=>o.points),full:c.flatMap(o=>o.paras)}}}summaryHtml(){let t=this.doc(),{summary:e,sections:i,keyTermDefs:n,reviewQs:l}=this.nlp;if(!e.tldr.length)return`<div class="empty-state"><h3>Not enough to summarize</h3><p>This document has too little readable text. Try the Full text tab.</p></div>`;let m=[];return m.push(`
      <div class="rvw-head">
        <div class="rvw-eyebrow">${this.ico(`book`)} Study Reviewer</div>
        <h1 class="rvw-title">${this.esc(t.name)}</h1>
        <div class="rvw-meta">${s$2(t.type)} \xB7 ${t.wordCount.toLocaleString()} words \xB7 ${i.length} section${i.length===1?``:`s`} \xB7 ${n.length} key term${n.length===1?``:`s`}</div>
      </div>`),e.tldr.length&&m.push(`
        <div class="rvw-part">
          <div class="rvw-part-head"><span class="rvw-num">I</span><h3>Overview</h3></div>
          ${e.tldr.map(c=>`<p class="rvw-overview" data-point>${this.esc(c)}</p>`).join(``)}
        </div>`),n.length&&m.push(`
        <div class="rvw-part">
          <div class="rvw-part-head"><span class="rvw-num">II</span><h3>Key Terms &amp; Definitions</h3></div>
          <dl class="rvw-terms">
            ${n.map(c=>`<div class="rvw-term"><dt>${this.esc(c.term)}</dt><dd>${this.esc(c.def)}</dd></div>`).join(``)}
          </dl>
        </div>`),e.sections.length&&m.push(`
        <div class="rvw-part">
          <div class="rvw-part-head"><span class="rvw-num">III</span><h3>Section Notes</h3></div>
          ${e.sections.map((c,s)=>`
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
        </div>`),m.join(``)+`<p class="sum-note">Forged from your document — open <strong>Full text</strong> to read everything.</p>`}selfTestItemHtml(t){let e={tf:`TRUE or FALSE`,matching:`MATCHING`,ordering:`ORDERING`},i=``,n=``,l=``,m=(s,h=!1)=>`<div class="rvq-opts">${(s||[]).map((a,d)=>`<span>${h?d+1+`.`:String.fromCharCode(65+d)+`.`} ${this.esc(a)}</span>`).join(``)}</div>`;if(t.type===`mcq`||t.type===`except`)i=(t.type===`except`?`<span class="rvq-tag">EXCEPT</span> `:``)+this.esc(t.stem),n=m(t.options),l=t.options?.[t.answerIndex]??``;else if(t.type===`multi`)i=`<span class="rvq-tag">SELECT 2</span> `+this.esc(t.stem),n=m(t.options),l=(t.answerIndices||[]).map(s=>t.options?.[s]).filter(Boolean).join(` · `);else if(t.type===`tf`)i=`<span class="rvq-tag">T/F</span> ${this.esc(t.statement)}`,l=t.answer?`True`:`False`;else if(t.type===`fib`)i=this.esc(t.stem),n=m(t.choices,!0),l=t.choices?.[t.answerIndex]??``;else if(t.type===`id`)i=`Identify the term: ${this.esc(t.clue)}`,l=t.answer??``;else if(t.type===`matching`)i=`${this.esc(t.prompt)}`,n=`
        <div class="rvq-opts rvq-match">
          <div class="rvq-match-col"><b>Terms</b>${(t.pairs||[]).map(s=>`<span>${this.esc(s.left)}</span>`).join(``)}</div>
          <div class="rvq-match-col"><b>Definitions</b>${(t.rightOrder||[]).map(s=>`<span>${this.esc(t.pairs?.[s]?.right||``)}</span>`).join(``)}</div>
        </div>`,l=(t.pairs||[]).map(s=>`${s.left} \u2192 ${s.right}`).join(` · `);else if(t.type===`ordering`)i=`${this.esc(t.prompt)}`,n=m(t.shuffled||t.steps,!0),l=(t.steps||[]).map((s,h)=>`${h+1}. ${s}`).join(`  ·  `);else return``;return`<li class="rvq">
      <div class="rvq-q">${e[t.type]?`<span class="rvq-tag">${e[t.type]}</span> `:``}${i}${n}</div>
      <details class="rvq-reveal"><summary>Check answer</summary><span>${this.esc(l)}</span></details>
    </li>`}fullHtml(){return this.nlp.sections.map(t=>`
      <section class="reader-section">
        ${t.title?`<h2>${this.esc(t.title)}</h2>`:``}
        ${t.paras.map(e=>`<p data-para>${this.esc(e)}</p>`).join(``)}
      </section>`).join(``)+`<p class="reader-end">· · ·</p>`}trust(t){return this.sanitizer.bypassSecurityTrustHtml(t)}aiReviewHtml(){return Ie(this.aiReviewer(),t=>this.esc(t))}async tryGenerateAi(){if(this.aiTried||this.aiState()===`ready`)return;this.aiTried=!0;let t=this.doc();if(!t?.text||String(t.text).trim().length<300)return;this.aiState.set(`generating`);let e=await Ee(t);if(e.reviewer)this.aiReviewer.set(e.reviewer),this.aiState.set(`ready`),this.byok.notifyAiOk();else if(e.error!==`not_enough_content`)this.aiState.set(`error`),this.byok.notifyAiFailure(e.error||`error`);else{this.aiState.set(`idle`);return}this.applyView()}retryAi(){this.aiState()!==`generating`&&(this.aiTried=!1,this.aiState.set(`idle`),this.tryGenerateAi())}setAiMode(t){this.aiMode.set(t),Y({reviewerAiMode:t}),this.applyView()}applyView(){let t=this.content?.nativeElement;if(!t)return;let e=t.closest(`.rev-screen`)?.querySelector(`.font-controls`);if(!this.nlp){this.contentHtml.set(this.trust(`<div class="reader-loading">Preparing your document…</div>`)),this.nlpBuilding||(this.nlpBuilding=!0,setTimeout(()=>{this.buildNlp(),this.nlpBuilding=!1,this.applyView()},0));return}this.contentHtml.set(this.trust(this.aiMode()&&this.aiReviewer()?this.aiReviewHtml():this.summaryHtml())),t.classList.add(`summary-mode`),e&&(e.style.visibility=`hidden`),this.clearFind()}findQuery=``;clearFind(){this.findMatches=[],this.findPos=-1,this.findCount.set(``),this.content?.nativeElement?.querySelectorAll(`mark.find-hit, mark.find-current`).forEach(e=>{let i=e.parentNode;i.replaceChild(document.createTextNode(e.textContent||``),e),i.normalize()})}runFind(){this.clearFind();let t=this.findQuery.trim();if(t.length<2)return;let e=this.content.nativeElement,i=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),n=[];for(;i.nextNode();){let l=i.currentNode;l.nodeValue&&l.nodeValue.toLowerCase().includes(t.toLowerCase())&&n.push(l)}for(let l of n){let m=l.nodeValue||``,c=document.createDocumentFragment(),s=0,h=m.toLowerCase(),a=h.indexOf(t.toLowerCase());for(;a!==-1;){c.appendChild(document.createTextNode(m.slice(s,a)));let d=document.createElement(`mark`);d.className=`find-hit`,d.textContent=m.slice(a,a+t.length),c.appendChild(d),this.findMatches.push(d),s=a+t.length,a=h.indexOf(t.toLowerCase(),s)}c.appendChild(document.createTextNode(m.slice(s))),l.parentNode.replaceChild(c,l)}this.stepFind(0)}onFindKey(t){t.key===`Enter`&&(t.preventDefault(),this.stepFind(t.shiftKey?-1:1)),t.key===`Escape`&&(this.findQuery=``,this.clearFind())}stepFind(t){if(!this.findMatches.length){this.findCount.set(`0/0`);return}this.findPos=t===0?0:(this.findPos+t+this.findMatches.length)%this.findMatches.length,this.findMatches.forEach((e,i)=>e.classList.toggle(`find-current`,i===this.findPos)),this.findCount.set(`${this.findPos+1}/${this.findMatches.length}`),this.findMatches[this.findPos]?.scrollIntoView({block:`center`,behavior:`smooth`})}attachSaveOnPress(){let t=this.content?.nativeElement;t&&t.querySelectorAll(`[data-para]`).forEach(e=>{let i=e,n=null,l=null,m=s=>{s.pointerType===`mouse`&&s.button!==0||(l=null,n=setTimeout(async()=>{l=i;try{let h=(i.textContent||``).trim().slice(0,300),a=this.nlp.keyTermDefs.find(d=>h.toLowerCase().includes(d.term.toLowerCase()))?.term||this.firstKeyPhrase(h);await ce({docId:this.doc().id,sentence:h,term:a,type:`note`}),i.classList.add(`saved-flash`),setTimeout(()=>i.classList.remove(`saved-flash`),900),this.toast.toast(`Saved to your review deck ✦`)}catch{this.toast.toast(`Could not save this line`,!0)}},550))},c=()=>{l===null&&clearTimeout(n)};i.addEventListener(`pointerdown`,m),i.addEventListener(`pointerup`,c),i.addEventListener(`pointerleave`,c),i.addEventListener(`pointercancel`,c)})}firstKeyPhrase(t){let e=t.split(/\s+/).slice(0,6);for(let i=0;i<Math.min(3,e.length);i++){let n=e.slice(i).join(` `).match(/^([A-Z][a-zA-Z'’-]+(?:\s+(?:of|the|de|van|von|da)?[A-Z][a-zA-Z'’-]+)*)/);if(n&&n[1].length>3&&!ze.test(n[1].split(` `)[0]))return n[1].split(` `).slice(0,3).join(` `)}return e.slice(0,4).join(` `)}applyScale(){this.content&&(this.content.nativeElement.style.fontSize=(15*this.scale).toFixed(1)+`px`)}fontMinus(){this.scale=Math.max(.85,+(this.scale-.1).toFixed(2)),Y({readerScale:this.scale}),this.applyScale()}fontPlus(){this.scale=Math.min(1.5,+(this.scale+.1).toFixed(2)),Y({readerScale:this.scale}),this.applyScale()}quizMe(){this.qs.currentDocId.set(this.doc().id),this.router.navigate([`/doc`,this.doc().id,`setup`])}back(){this.router.navigate([`/doc`,this.doc().id])}exportMd(){R(this.doc()),this.toast.toast(`Downloaded study sheet (.md)`)}async exportPdf(){try{await H(this.doc(),{keyTermDefs:this.nlp?.keyTermDefs||[],reviewQs:this.nlp?.reviewQs||[]}),this.toast.toast(`PDF handout downloaded ✓`)}catch{this.toast.toast(`Could not build the PDF`,!0)}}print(){O(this.doc())||this.toast.toast(`Allow pop-ups to print`)}static ɵfac=function(e){return new(e||r$2)};static ɵcmp=Cl({type:r$2,selectors:[[`app-reviewer`]],viewQuery:function(e,i){if(e&1&&Qg(Ne,5),e&2){let n;bw(n=Tw())&&(i.content=n.first)}},decls:2,vars:2,consts:[[`content`,``],[3,`fullscreen`],[1,`back-header`],[`data-tooltip`,`Back`,1,`icon-btn`,3,`click`,`innerHTML`],[2,`flex`,`1`,`min-width`,`0`],[2,`font-size`,`14px`,`font-weight`,`600`,`white-space`,`nowrap`,`overflow`,`hidden`,`text-overflow`,`ellipsis`],[2,`font-size`,`11.5px`,`color`,`var(--text-faint)`],[1,`font-controls`,2,`display`,`flex`,`gap`,`4px`],[`data-tooltip`,`Smaller text`,1,`icon-btn`,`text-btn`,3,`click`],[`data-tooltip`,`Larger text`,1,`icon-btn`,`text-btn`,3,`click`],[1,`screen`,`rev-screen`],[1,`ai-mode-toggle`],[1,`ai-gen-bar`],[1,`ai-gen-bar`,`err`],[1,`find-bar`],[`type`,`search`,`placeholder`,`Find in document…`,`aria-label`,`Find in document`,`autocomplete`,`off`,1,`text-input`,3,`ngModelChange`,`input`,`keydown`,`ngModel`],[1,`faint`],[`id`,`review-content`,1,`reader`,`summary-mode`,3,`innerHTML`],[1,`reader-actions`],[1,`btn`,`btn-primary`,3,`click`],[3,`innerHTML`],[`data-tooltip`,`Download this reviewer as a formatted PDF handout`,1,`btn`,`btn-primary`,2,`margin-top`,`10px`,`width`,`100%`,3,`click`],[2,`display`,`grid`,`grid-template-columns`,`1fr 1fr`,`gap`,`8px`,`width`,`100%`,`margin-top`,`10px`],[`data-tooltip`,`Download the study sheet as Markdown`,1,`btn`,`btn-secondary`,3,`click`],[`data-tooltip`,`Open a printable study sheet`,1,`btn`,`btn-secondary`,3,`click`],[`type`,`button`,3,`click`],[1,`ai-dot`],[`type`,`button`,1,`ai-retry`,3,`click`]],template:function(e,i){if(e&1&&(xs(0,`ion-content`,1),sw(1,je,41,26),Nl()),e&2){let n;Ug(`fullscreen`,!0),uI(),aw((n=i.doc())?1:-1,n)}},dependencies:[Gs,un,Ie$1,on,Ot,T],encapsulation:2})};export{Ve as ReviewerPage};