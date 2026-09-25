import{n as r,r as s}from"./chunk-CCnQ1X3m.js";import"./chunk-Dqyvoa3d.js";import"./chunk-hh0W7bTI.js";import"./chunk-Bq6LZ2sh.js";import"./chunk-D4k-zadY.js";import"./chunk-DEURnQ86.js";import"./chunk-CABSGZFi.js";import"./chunk-tv0E5ky_.js";import{$t as qg,Cn as yw,Dt as gm,En as zt,Et as g,F as Ol,G as Tw,K as Uf,Kt as nm,N as Nl,S as JI,Tt as fm,Ut as mm,V as Ra,Vt as mS,Xt as pS,_n as xs,a as Bg,c as Cl,dt as bb,en as rS,et as Ws,in as sw,m as Ew,pt as bw,q as Ug,qt as nr,sn as uI,ut as aw,v as Hf,vn as yE,vt as dm,w as Jw,xt as eC,z as Qg}from"./chunk-DNNweo43.js";import{r as Ta}from"./chunk-dOeny1GO.js";import{$ as me,St as j,T as Kt,_t as h,gt as a,ht as d,i as p$1,pt as zt$1,st as tt,z as Z}from"./main-XT6QJ25J.js";import{a as M,l as X}from"./chunk-BiM_qOS_.js";import{t as B}from"./chunk-C9txRCag.js";import{d as at,o as Oe$1}from"./chunk-OenFUPh_.js";import"./chunk-Dqt6NRMF.js";import{a as q,r as V,t as K$1}from"./chunk-BzzalYeM.js";import{t as a$1}from"./chunk-CCPKOP-2.js";import{n as Ot,o as on,s as un,t as Ie$1}from"./chunk-oL0wvA0A.js";import{t as n}from"./chunk-BxT9_UAb.js";import{t as a$2}from"./chunk-D6aT4yUI.js";var Ie=14e3;var Le=`You are an expert exam reviewer writer. Read the DOCUMENT and produce a complete exam reviewer in strict JSON \u2014 the kind a top student would write by hand to cram from.

Return JSON with exactly this shape:
{
  "title": "Main Subject \u2014 Exam Reviewer",
  "intro": "1-2 sentences: what the document covers overall.",
  "acronyms": [
    { "acr": "TCP", "expansion": "Transmission Control Protocol", "meaning": "Rules that guarantee data arrives complete and in order." },
    { "acr": "PAPA", "expansion": "Privacy, Accuracy, Property, Accessibility", "meaning": "The four data-privacy concerns." }
  ],
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
18. maxOutputTokens is large \u2014 use it: be thorough, this is the student's main study material.
19. "acronyms" \u2014 every acronym or initialism the DOCUMENT uses (TCP, ATP, LAN, PAPA, HTML...): "acr" is the short form, "expansion" is what the letters stand for, "meaning" is one plain line about what it IS. Max 12, exam-relevant first. Also spell an acronym out inline the first time it appears in a definition or meaning, like "TCP (Transmission Control Protocol)". Empty array when the document has none.`;function p(r){return String(r||``).replace(/\s+/g,` `).trim()}function Oe(r){let i=[[1e3,`M`],[900,`CM`],[500,`D`],[400,`CD`],[100,`C`],[90,`XC`],[50,`L`],[40,`XL`],[10,`X`],[9,`IX`],[5,`V`],[4,`IV`],[1,`I`]],e=``;for(let[t,n]of i)for(;r>=t;)e+=n,r-=t;return e}function K(r,i){let e=r.indexOf(` — `);return e<1?i(r):`<b>${i(r.slice(0,e))}</b> \u2014 ${i(r.slice(e+3))}`}function Ve(r){if(!r||!Array.isArray(r.parts)||!r.parts.length)return null;let i=[],e=1;for(let a of r.parts){if(!a||!Array.isArray(a.sections)||!a.sections.length)continue;let m=[];for(let s of a.sections){let w=p(s.explanation),C=Array.isArray(s.bullets)?s.bullets.map(p).filter(Boolean):[],P=Array.isArray(s.steps)?s.steps.map(p).filter(Boolean):[],N=Array.isArray(s.terms)?s.terms.map(A=>({term:p(A?.term),meaning:p(A?.meaning).replace(/^meaning:\s*/i,``),bullets:Array.isArray(A?.bullets)?A.bullets.map(p).filter(Boolean):[],memory:p(A?.memory)||null})).filter(A=>A.term&&(A.meaning||A.bullets.length)):[];if(!w&&!C.length&&!P.length&&!N.length)continue;let f=s.table&&Array.isArray(s.table.headers)&&Array.isArray(s.table.rows)&&s.table.rows.length?{headers:s.table.headers.map(p).filter(Boolean),rows:s.table.rows.map(A=>Array.isArray(A)?A.map(p):[]).filter(A=>A.length)}:null,k=Number(s.stars);m.push({num:s.num!=null?Number(s.num):e,heading:p(s.heading)||`Section ${e}`,mustKnow:p(s.mustKnow)||null,stars:Number.isFinite(k)?Math.max(0,Math.min(3,Math.round(k))):null,definition:p(s.definition)||null,explanation:w,terms:N,bullets:C,steps:P,table:f,mnemonic:p(s.mnemonic)||null,important:p(s.important)||null,example:p(s.example)||null,memory:p(s.memory)||null,examClue:p(s.examClue)||null}),e++}if(m.length){let s=(p(a.title)||`PART`).replace(/^PART\s+[IVXLC\d]+\s*[—–-]?\s*/i,``)||`PART`;i.push({title:s,sections:m})}}if(!i.length)return null;let t=Array.isArray(r.highYield)?r.highYield.map(a=>({label:p(a?.label),items:Array.isArray(a?.items)?a.items.map(p).filter(Boolean):[]})).filter(a=>a.label&&a.items.length):[],n=Array.isArray(r.idQuestions)?r.idQuestions.map(a=>({clue:p(a?.clue),answer:p(a?.answer)})).filter(a=>a.clue&&a.answer):[],o=Array.isArray(r.myths)?r.myths.map(a=>({myth:p(a?.myth),fact:p(a?.fact)})).filter(a=>a.myth&&a.fact):[],d=Array.isArray(r.gaps)?r.gaps.map(p).filter(Boolean).slice(0,5):[],c=Array.isArray(r.finalReview)?r.finalReview.map(p).filter(Boolean):[],l=Array.isArray(r.acronyms)?r.acronyms.map(a=>({acr:p(a?.acr).toUpperCase().replace(/[^A-Z0-9]/g,``),expansion:p(a?.expansion),meaning:p(a?.meaning)})).filter(a=>a.acr.length>=2&&a.acr.length<=10&&a.expansion):[],u=new Set,h=l.filter(a=>u.has(a.acr)?!1:(u.add(a.acr),!0)).slice(0,12);return{v:4,title:p(r.title)||`Exam Reviewer`,intro:p(r.intro)||``,acronyms:h,parts:i,idQuestions:n,myths:o,gaps:d,finalReview:c,highYield:t}}function Fe(r){if(r.length<=Ie)return[r];let i=[],e=r.split(/\n{2,}/),t=``;for(let n of e)(t+`

`+n).length>Ie&&t?(i.push(t),t=n):t=t?t+`

`+n:n;return t&&i.push(t),i.slice(0,3)}async function Ne(r$1){let i=r$1.reviewerAI;if((Array.isArray(i)?i.length:i?.parts?.length)&&i.v===4)return{reviewer:i,cached:!0};let t=String(r$1.text||``).trim();if(t.length<300)return{error:`not_enough_content`};let n=Fe(t),o=null,d=-1,c=!1;for(let l=0;l<n.length&&!o;l++){let u=n.length>1?`DOCUMENT (part ${l+1} of ${n.length}):

${n[l]}

Cover only the topics in this part.`:`DOCUMENT:

${n[l]}`;try{let h=await j(`${Le}

${u}`,{json:!0,maxOutputTokens:8e3,temperature:.3,timeoutMs:95e3}),a;try{a=JSON.parse(h)}catch{let m=h.match(/\{[\s\S]*\}/);if(m)try{a=JSON.parse(m[0])}catch{a=null}}if(o=Ve(a),o&&(d=l),!o&&n.length>1)try{o=Ve(JSON.parse(await j(`${Le}

${u}

Return ONLY valid JSON.`,{json:!0,maxOutputTokens:8e3,temperature:.2,timeoutMs:95e3})))}catch{}}catch(h){let a=String(h?.message||h);if(a.includes(`no_keys_configured`)||a.includes(`origin_not_allowed`))return{error:`relay_unavailable`};/timeout|upstream_timeout|504|abort/i.test(a)&&(c=!0)}}if(!o)return{error:c?`timeout`:`generation_failed`};if(n.length>1){let l=Array.isArray(o.gaps)?o.gaps:[];l.unshift(`This file is long \u2014 the reviewer was built from part ${d+1} of ${n.length}; later sections may be missing.`),o=s(r({},o),{gaps:l.slice(0,6)})}try{await zt$1(r$1.id,{reviewerAI:o})}catch{}return{reviewer:o,cached:!1}}function He(r,i){let e=i,t=[];t.push(`
    <div class="rvw-head">
      <div class="rvw-eyebrow">\u2726 AI Exam Reviewer</div>
      <h1 class="rvw-title">${e(r.title)}</h1>
      ${r.intro?`<p class="rvw-overview">${e(r.intro)}</p>`:``}
    </div>`);let n=r.acronyms||[];n.length&&t.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">\u{1F511}</span><h3>Key Acronyms</h3></div>
        <p class="ai-hy-intro">What each abbreviation stands for:</p>
        ${n.map(a=>`
          <div class="ai-acr" data-para>
            <span class="ai-acr-badge">${e(a.acr)}</span>
            <span class="ai-acr-body"><b>${e(a.expansion)}</b>${a.meaning?` \u2014 ${e(a.meaning)}`:``}</span>
          </div>`).join(``)}
      </div>`);let o=0;for(let a of r.parts){o++;let m=(a.title||`PART`).replace(/^PART\s+[IVXLC\d]+\s*[—–-]?\s*/i,``)||`PART`;t.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">${Oe(o)}</span><h3>${e(m)}</h3></div>`);for(let s of a.sections){t.push(`<div class="ai-sec">`);let w=s.mustKnow?`<span class="ai-flag ${/VERY/i.test(s.mustKnow)?`hot`:/Important/i.test(s.mustKnow)?`warm`:`cool`}">${e(s.mustKnow)}</span>`:``,C=s.stars?`<span class="ai-stars">`+`⭐`.repeat(Math.min(3,s.stars))+`</span>`:``;if(t.push(`<div class="ai-sec-head"><span class="ai-num">${e(s.num)}</span><h4>${e(s.heading)}${C}</h4>${w}</div>`),s.definition){let f=s.definition.indexOf(`=`);t.push(f>0?`<p class="ai-def"><span class="ai-def-term">${e(s.definition.slice(0,f).trim())}</span> = ${e(s.definition.slice(f+1).trim())}</p>`:`<p class="ai-def">${e(s.definition)}</p>`)}s.explanation&&t.push(`<p class="ai-expl" data-para>${e(s.explanation)}</p>`);for(let f of s.terms||[]){if(t.push(`<div class="ai-term" data-para>`),t.push(`<div class="ai-term-name">\u{1F539} ${e(f.term)}</div>`),f.meaning){let k=f.meaning.replace(/^meaning:\s*/i,``);t.push(`<p class="ai-term-meaning"><span class="ai-term-label">Meaning:</span> ${e(k)}</p>`)}f.bullets&&f.bullets.length&&t.push(`<ul class="ai-bullets">${f.bullets.map(k=>`<li data-para>${K(k,e)}</li>`).join(``)}</ul>`),f.memory&&t.push(`<div class="ai-box ai-memory"><span class="ai-box-label">Memory</span><span>${e(f.memory)}</span></div>`),t.push(`</div>`)}let P=s.bullets||[],N=s.steps||[];P.length&&t.push(`<ul class="ai-bullets">${P.map(f=>`<li data-para>${K(f,e)}</li>`).join(``)}</ul>`),N.length&&t.push(`<ol class="ai-steps">${N.map(f=>`<li data-para>${K(f,e)}</li>`).join(``)}</ol>`),s.table&&t.push(`<table class="ai-table"><thead><tr>${s.table.headers.map(f=>`<th>${e(f)}</th>`).join(``)}</tr></thead><tbody>${s.table.rows.map(f=>`<tr>${f.map(k=>`<td>${e(k)}</td>`).join(``)}</tr>`).join(``)}</tbody></table>`),s.mnemonic&&t.push(`<div class="ai-mnemonic" data-para><span class="ai-mnemonic-label">\u{1F9E0} Memorize</span><span>${e(s.mnemonic)}</span></div>`),s.important&&t.push(`<div class="ai-box ai-important" data-para><span class="ai-box-label">Important</span><span>${e(s.important)}</span></div>`),s.example&&t.push(`<div class="ai-box ai-example" data-para><span class="ai-box-label">Example</span><span>${e(s.example)}</span></div>`),s.memory&&t.push(`<div class="ai-box ai-memory" data-para><span class="ai-box-label">Memory trick</span><span>${e(s.memory)}</span></div>`),s.examClue&&t.push(`<div class="ai-box ai-clue" data-para><span class="ai-box-label">Exam clue</span><span>${e(s.examClue)}</span></div>`),t.push(`</div>`)}t.push(`</div>`)}let d=r.highYield||[];d.length&&t.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">\u{1F525}</span><h3>Super Important Exam Points</h3></div>
        <p class="ai-hy-intro">If you're short on study time, memorize these first:</p>
        ${d.map(a=>`
          <div class="ai-hy">
            <div class="ai-hy-label">${e(a.label)}</div>
            <ul class="ai-bullets">${a.items.map(m=>`<li data-para>${e(m)}</li>`).join(``)}</ul>
          </div>`).join(``)}
      </div>`);let c=r.idQuestions||[];c.length&&t.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">\u{1F4DD}</span><h3>Possible Identification Questions</h3></div>
        ${c.map(a=>`
          <div class="ai-idq" data-para>
            <div class="ai-idq-clue">${e(a.clue)}</div>
            <div class="ai-idq-ans">\u2192 ${e(a.answer)}</div>
          </div>`).join(``)}
      </div>`);let l=r.myths||[];l.length&&t.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">\u2696\uFE0F</span><h3>Myths vs Facts</h3></div>
        ${l.map(a=>`
          <div class="ai-myth" data-para>
            <div class="ai-myth-row bad">\u274C <span>${e(a.myth)}</span></div>
            <div class="ai-myth-row good">\u2705 <span>${e(a.fact)}</span></div>
          </div>`).join(``)}
      </div>`);let u=r.finalReview||[];u.length&&t.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">\u{1F3AF}</span><h3>One-Minute Final Review</h3></div>
        <p class="ai-hy-intro">Before your exam, remember:</p>
        ${u.map(a=>{let m=a.indexOf(`=`);return m>0?`<p class="ai-def" data-para><span class="ai-def-term">${e(a.slice(0,m).trim())}</span> = ${e(a.slice(m+1).trim())}</p>`:`<p class="ai-def" data-para>${e(a)}</p>`}).join(``)}
      </div>`);let h=r.gaps||[];return h.length&&t.push(`
      <div class="ai-gaps" data-para>
        <div class="ai-gaps-head">\u26A0\uFE0F Possibly missing from this reviewer</div>
        <ul>${h.map(a=>`<li>${e(a)}</li>`).join(``)}</ul>
      </div>`),t.push(`<p class="sum-note">AI-generated from your document — always double-check against your original source before the exam.</p>`),t.join(``)}var je=[`content`];function ze(r,i){if(r&1){let e=yw();xs(0,`div`,11)(1,`button`,25),qg(`click`,function(){Uf(e);return Hf(Ew(2).setAiMode(!0))}),Ws(2,`span`,20),pS(3,`ico`),Jw(4,` AI reviewer`),Nl(),xs(5,`button`,25),qg(`click`,function(){Uf(e);return Hf(Ew(2).setAiMode(!1))}),Jw(6,`Quick notes`),Nl()()}if(r&2){let e=Ew(2);uI(),nm(`on`,e.aiMode()),uI(),Ug(`innerHTML`,mS(3,5,`sparkles`),yE),uI(3),nm(`on`,!e.aiMode())}}function Be(r,i){r&1&&(xs(0,`div`,12),Ws(1,`span`,26),Jw(2,` Forging your AI reviewer from this file… usually under a minute. Quick notes shown meanwhile.`),Nl())}function Qe(r,i){if(r&1){let e=yw();xs(0,`div`,13),Jw(1,`AI reviewer couldn't be generated`),xs(2,`button`,27),qg(`click`,function(){Uf(e);return Hf(Ew(2).retryAi())}),Jw(3,`Retry`),Nl(),xs(4,`button`,27),qg(`click`,function(){Uf(e);return Hf(Ew(2).byok.open(`The AI relay is busy or out of requests. Add your own free Gemini key to generate the reviewer.`))}),Jw(5,`Add a key`),Nl()()}}function Ue(r,i){if(r&1){let e=yw();xs(0,`header`,2)(1,`button`,3),pS(2,`ico`),qg(`click`,function(){Uf(e);return Hf(Ew().back())}),Nl(),xs(3,`div`,4)(4,`div`,5),Jw(5),Nl(),xs(6,`div`,6),Jw(7),Nl()(),xs(8,`div`,7)(9,`button`,8),qg(`click`,function(){Uf(e);return Hf(Ew().fontMinus())}),Jw(10,`A−`),Nl(),xs(11,`button`,9),qg(`click`,function(){Uf(e);return Hf(Ew().fontPlus())}),Jw(12,`A+`),Nl()()(),xs(13,`div`,10),sw(14,ze,7,7,`div`,11),sw(15,Be,3,0,`div`,12),sw(16,Qe,6,0,`div`,13),xs(17,`div`,14)(18,`input`,15),mm(`ngModelChange`,function(n){Uf(e);let o=Ew();return rS(o.findQuery,n)||(o.findQuery=n),Hf(n)}),qg(`input`,function(){Uf(e);return Hf(Ew().runFind())})(`keydown`,function(n){Uf(e);return Hf(Ew().onFindKey(n))}),Nl(),JI(),xs(19,`span`,16),Jw(20),Nl()(),Ws(21,`article`,17,0),xs(23,`div`,18)(24,`button`,19),qg(`click`,function(){Uf(e);return Hf(Ew().quizMe())}),Ws(25,`span`,20),pS(26,`ico`),Jw(27,` Quiz me on this`),Nl(),xs(28,`button`,21),qg(`click`,function(){Uf(e);return Hf(Ew().exportPdf())}),Ws(29,`span`,20),pS(30,`ico`),Jw(31),Nl(),xs(32,`div`,22)(33,`button`,23),qg(`click`,function(){Uf(e);return Hf(Ew().exportMd())}),Ws(34,`span`,20),pS(35,`ico`),Jw(36,` Export .md`),Nl(),xs(37,`button`,24),qg(`click`,function(){Uf(e);return Hf(Ew().print())}),Ws(38,`span`,20),pS(39,`ico`),Jw(40,` Print sheet`),Nl()()()()}if(r&2){let e=i,t=Ew();uI(),Ug(`innerHTML`,mS(2,19,`chevronLeft`),yE),uI(4),dm(e.name),uI(2),fm(``,t.typeLabel(e.type),` · `,e.wordCount.toLocaleString(),` words`),uI(7),aw(t.aiState()===`ready`?14:-1),uI(),aw(t.aiState()===`generating`?15:-1),uI(),aw(t.aiState()===`error`?16:-1),uI(),nm(`hidden`,!t.findVisible()),uI(),gm(`ngModel`,t.findQuery),eC(),uI(2),dm(t.findCount()),uI(),Ug(`innerHTML`,t.contentHtml(),yE),uI(4),Ug(`innerHTML`,mS(26,21,`play`),yE),uI(3),Ug(`disabled`,t.buildingPdf()||!t.reviewerReady()||t.aiMode()&&t.aiState()===`generating`),Bg(`aria-busy`,t.buildingPdf()),uI(),Ug(`innerHTML`,mS(30,23,`download`),yE),uI(2),Ol(` `,t.buildingPdf()?`Building PDF…`:t.aiMode()&&t.aiReviewer()?`Export AI Reviewer PDF`:`Export Reviewer PDF`,` `),uI(3),Ug(`innerHTML`,mS(35,25,`download`),yE),uI(4),Ug(`innerHTML`,mS(39,27,`print`),yE)}}function Y(r,i=3){let e=[];for(let t=0;t<r.length;t+=i)e.push(r.slice(t,t+i));return e.map(t=>t.join(` `))}var Ke=/^(The|This|That|These|Those|It|Its|In|At|On|And|But|For|With|When|After|Today|Just|Only|Most|Many|Both|Each|Such|Then|They|There)$/;var De=class r$2{route=g(zt);router=g(Ra);toast=g(a);ui=g(n);typeLabel=a$2;qs=g(a$1);byok=g(d);sanitizer=g(bb);content;doc=nr(null);contentHtml=nr(``);scale=1;aiReviewer=nr(null);aiState=nr(`idle`);aiMode=nr(!0);aiTried=!1;findVisible=nr(!1);findCount=nr(``);reviewerReady=nr(!1);buildingPdf=nr(!1);nlp=null;nlpBuilding=!1;findMatches=[];findPos=-1;zoom=null;get themeIcon(){return this.ui.theme()===`dark`?`sun`:`moon`}ico(i){return h(i)}esc(i){return String(i).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}async load(){let e=await Kt(this.route.snapshot.paramMap.get(`id`)||``);if(!e){this.router.navigateByUrl(`/tabs/library`);return}this.reviewerReady.set(!1),this.doc.set(e),e.reviewerAI?.parts?.length&&(this.aiReviewer.set(e.reviewerAI),this.aiState.set(`ready`));let t=Z();this.scale=t.readerScale||1,this.aiMode.set(t.reviewerAiMode!==!1),setTimeout(()=>this.applyView(),0),this.tryGenerateAi()}ngAfterViewInit(){this.load()}buildNlp(){let i=this.doc(),e=M(i.text),t=X(i.text),n=t.topics,o=t.membership,d=B(i.text),c=[];if(n.length&&e.length){let m=new Map(n.map(w=>[w.title,[]])),s=[];for(let w of e){let C=o.get(w);C&&m.has(C)?m.get(C).push(w):s.push(w)}s.length>=2&&c.push({title:`Overview`,paras:Y(s)});for(let w of n){let C=m.get(w.title);C?.length&&c.push({title:w.title,paras:Y(C)})}}else c.push({title:null,paras:Y(e.length?e:i.text.split(/(?<=[.!?])\s+/))});let l=[],u=new Set;for(let m of d.sections)for(let s of m.terms){let w=s.toLowerCase();if(u.has(w)||l.length>=8)continue;u.add(w);let C=e.find(P=>P.toLowerCase().includes(w)&&P.length>20);C&&l.push({term:s,def:C})}let a=(Oe$1(i,{count:6,mix:r({},at),difficulty:`medium`,shuffle:!1,fixedSeed:7}).questions||[]).filter(m=>m.type!==`short`);this.nlp={sents:e,topics:n,summary:d,sections:c,keyTermDefs:l,reviewQs:a,readTargets:{summary:d.sections.flatMap(m=>m.points),full:c.flatMap(m=>m.paras)}}}summaryHtml(){let i=this.doc(),{summary:e,sections:t,keyTermDefs:n,reviewQs:o}=this.nlp;if(!e.tldr.length)return`<div class="empty-state"><h3>Not enough to summarize</h3><p>This document has too little readable text. Try the Full text tab.</p></div>`;let d=[];return d.push(`
      <div class="rvw-head">
        <div class="rvw-eyebrow">${this.ico(`book`)} Study Reviewer</div>
        <h1 class="rvw-title">${this.esc(i.name)}</h1>
        <div class="rvw-meta">${a$2(i.type)} \xB7 ${i.wordCount.toLocaleString()} words \xB7 ${t.length} section${t.length===1?``:`s`} \xB7 ${n.length} key term${n.length===1?``:`s`}</div>
      </div>`),e.tldr.length&&d.push(`
        <div class="rvw-part">
          <div class="rvw-part-head"><span class="rvw-num">I</span><h3>Overview</h3></div>
          ${e.tldr.map(c=>`<p class="rvw-overview" data-point>${this.esc(c)}</p>`).join(``)}
        </div>`),n.length&&d.push(`
        <div class="rvw-part">
          <div class="rvw-part-head"><span class="rvw-num">II</span><h3>Key Terms &amp; Definitions</h3></div>
          <dl class="rvw-terms">
            ${n.map(c=>`<div class="rvw-term"><dt>${this.esc(c.term)}</dt><dd>${this.esc(c.def)}</dd></div>`).join(``)}
          </dl>
        </div>`),e.sections.length&&d.push(`
        <div class="rvw-part">
          <div class="rvw-part-head"><span class="rvw-num">III</span><h3>Section Notes</h3></div>
          ${e.sections.map((c,l)=>`
            <div class="sum-section">
              <div class="sum-head">
                <span class="sum-num">${String(l+1).padStart(2,`0`)}</span>
                <h4>${this.esc(c.title)}</h4>
                <span class="chip-count">${c.sentenceCount} sentence${c.sentenceCount===1?``:`s`}</span>
              </div>
              <ul class="sum-points">
                ${c.points.map(u=>`<li>${this.esc(u)}</li>`).join(``)}
              </ul>
            </div>`).join(``)}
        </div>`),o.length&&d.push(`
        <div class="rvw-part">
          <div class="rvw-part-head"><span class="rvw-num">IV</span><h3>Test Yourself</h3></div>
          <ol class="rvq-list">
            ${o.map(c=>this.selfTestItemHtml(c)).join(``)}
          </ol>
        </div>`),d.join(``)+`<p class="sum-note">Forged from your document — open <strong>Full text</strong> to read everything.</p>`}selfTestItemHtml(i){let e={tf:`TRUE or FALSE`,matching:`MATCHING`,ordering:`ORDERING`},t=``,n=``,o=``,d=(l,u=!1)=>`<div class="rvq-opts">${(l||[]).map((h,a)=>`<span>${u?a+1+`.`:String.fromCharCode(65+a)+`.`} ${this.esc(h)}</span>`).join(``)}</div>`;if(i.type===`mcq`||i.type===`except`)t=(i.type===`except`?`<span class="rvq-tag">EXCEPT</span> `:``)+this.esc(i.stem),n=d(i.options),o=i.options?.[i.answerIndex]??``;else if(i.type===`multi`)t=`<span class="rvq-tag">SELECT 2</span> `+this.esc(i.stem),n=d(i.options),o=(i.answerIndices||[]).map(l=>i.options?.[l]).filter(Boolean).join(` · `);else if(i.type===`tf`)t=`<span class="rvq-tag">T/F</span> ${this.esc(i.statement)}`,o=i.answer?`True`:`False`;else if(i.type===`fib`)t=this.esc(i.stem),n=d(i.choices,!0),o=i.choices?.[i.answerIndex]??``;else if(i.type===`id`)t=`Identify the term: ${this.esc(i.clue)}`,o=i.answer??``;else if(i.type===`matching`)t=`${this.esc(i.prompt)}`,n=`
        <div class="rvq-opts rvq-match">
          <div class="rvq-match-col"><b>Terms</b>${(i.pairs||[]).map(l=>`<span>${this.esc(l.left)}</span>`).join(``)}</div>
          <div class="rvq-match-col"><b>Definitions</b>${(i.rightOrder||[]).map(l=>`<span>${this.esc(i.pairs?.[l]?.right||``)}</span>`).join(``)}</div>
        </div>`,o=(i.pairs||[]).map(l=>`${l.left} \u2192 ${l.right}`).join(` · `);else if(i.type===`ordering`)t=`${this.esc(i.prompt)}`,n=d(i.shuffled||i.steps,!0),o=(i.steps||[]).map((l,u)=>`${u+1}. ${l}`).join(`  ·  `);else return``;return`<li class="rvq">
      <div class="rvq-q">${e[i.type]?`<span class="rvq-tag">${e[i.type]}</span> `:``}${t}${n}</div>
      <details class="rvq-reveal"><summary>Check answer</summary><span>${this.esc(o)}</span></details>
    </li>`}fullHtml(){return this.nlp.sections.map(i=>`
      <section class="reader-section">
        ${i.title?`<h2>${this.esc(i.title)}</h2>`:``}
        ${i.paras.map(e=>`<p data-para>${this.esc(e)}</p>`).join(``)}
      </section>`).join(``)+`<p class="reader-end">· · ·</p>`}trust(i){return this.sanitizer.bypassSecurityTrustHtml(i)}aiReviewHtml(){return He(this.aiReviewer(),i=>this.esc(i))}async tryGenerateAi(){if(this.aiTried||this.aiState()===`ready`)return;this.aiTried=!0;let i=this.doc();if(!i?.text||String(i.text).trim().length<300)return;this.aiState.set(`generating`);let e=await Ne(i);if(e.reviewer)this.aiReviewer.set(e.reviewer),this.aiState.set(`ready`),this.byok.notifyAiOk();else if(e.error!==`not_enough_content`)this.aiState.set(`error`),this.byok.notifyAiFailure(e.error||`error`);else{this.aiState.set(`idle`);return}this.applyView()}retryAi(){this.aiState()!==`generating`&&(this.aiTried=!1,this.aiState.set(`idle`),this.tryGenerateAi())}setAiMode(i){this.aiMode.set(i),tt({reviewerAiMode:i}),this.applyView()}applyView(){let i=this.content?.nativeElement;if(!i)return;let e=i.closest(`.rev-screen`)?.querySelector(`.font-controls`);if(!this.nlp){this.contentHtml.set(this.trust(`<div class="reader-loading">Preparing your document…</div>`)),this.nlpBuilding||(this.nlpBuilding=!0,setTimeout(()=>{this.buildNlp(),this.nlpBuilding=!1,this.applyView()},0));return}this.contentHtml.set(this.trust(this.aiMode()&&this.aiReviewer()?this.aiReviewHtml():this.summaryHtml())),this.reviewerReady.set(!0),i.classList.add(`summary-mode`),e&&(e.style.visibility=`hidden`),this.clearFind()}findQuery=``;clearFind(){this.findMatches=[],this.findPos=-1,this.findCount.set(``),this.content?.nativeElement?.querySelectorAll(`mark.find-hit, mark.find-current`).forEach(e=>{let t=e.parentNode;t.replaceChild(document.createTextNode(e.textContent||``),e),t.normalize()})}runFind(){this.clearFind();let i=this.findQuery.trim();if(i.length<2)return;let e=this.content.nativeElement,t=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),n=[];for(;t.nextNode();){let o=t.currentNode;o.nodeValue&&o.nodeValue.toLowerCase().includes(i.toLowerCase())&&n.push(o)}for(let o of n){let d=o.nodeValue||``,c=document.createDocumentFragment(),l=0,u=d.toLowerCase(),h=u.indexOf(i.toLowerCase());for(;h!==-1;){c.appendChild(document.createTextNode(d.slice(l,h)));let a=document.createElement(`mark`);a.className=`find-hit`,a.textContent=d.slice(h,h+i.length),c.appendChild(a),this.findMatches.push(a),l=h+i.length,h=u.indexOf(i.toLowerCase(),l)}c.appendChild(document.createTextNode(d.slice(l))),o.parentNode.replaceChild(c,o)}this.stepFind(0)}onFindKey(i){i.key===`Enter`&&(i.preventDefault(),this.stepFind(i.shiftKey?-1:1)),i.key===`Escape`&&(this.findQuery=``,this.clearFind())}stepFind(i){if(!this.findMatches.length){this.findCount.set(`0/0`);return}this.findPos=i===0?0:(this.findPos+i+this.findMatches.length)%this.findMatches.length,this.findMatches.forEach((e,t)=>e.classList.toggle(`find-current`,t===this.findPos)),this.findCount.set(`${this.findPos+1}/${this.findMatches.length}`),this.findMatches[this.findPos]?.scrollIntoView({block:`center`,behavior:`smooth`})}attachSaveOnPress(){let i=this.content?.nativeElement;i&&i.querySelectorAll(`[data-para]`).forEach(e=>{let t=e,n=null,o=null,d=l=>{l.pointerType===`mouse`&&l.button!==0||(o=null,n=setTimeout(async()=>{o=t;try{let u=(t.textContent||``).trim().slice(0,300),h=this.nlp.keyTermDefs.find(a=>u.toLowerCase().includes(a.term.toLowerCase()))?.term||this.firstKeyPhrase(u);await me({docId:this.doc().id,sentence:u,term:h,type:`note`}),t.classList.add(`saved-flash`),setTimeout(()=>t.classList.remove(`saved-flash`),900),this.toast.toast(`Saved to your review deck ✦`)}catch{this.toast.toast(`Could not save this line`,!0)}},550))},c=()=>{o===null&&clearTimeout(n)};t.addEventListener(`pointerdown`,d),t.addEventListener(`pointerup`,c),t.addEventListener(`pointerleave`,c),t.addEventListener(`pointercancel`,c)})}firstKeyPhrase(i){let e=i.split(/\s+/).slice(0,6);for(let t=0;t<Math.min(3,e.length);t++){let n=e.slice(t).join(` `).match(/^([A-Z][a-zA-Z'’-]+(?:\s+(?:of|the|de|van|von|da)?[A-Z][a-zA-Z'’-]+)*)/);if(n&&n[1].length>3&&!Ke.test(n[1].split(` `)[0]))return n[1].split(` `).slice(0,3).join(` `)}return e.slice(0,4).join(` `)}applyScale(){this.content&&(this.content.nativeElement.style.fontSize=(15*this.scale).toFixed(1)+`px`)}fontMinus(){this.scale=Math.max(.85,+(this.scale-.1).toFixed(2)),tt({readerScale:this.scale}),this.applyScale()}fontPlus(){this.scale=Math.min(1.5,+(this.scale+.1).toFixed(2)),tt({readerScale:this.scale}),this.applyScale()}quizMe(){this.qs.currentDocId.set(this.doc().id),this.router.navigate([`/doc`,this.doc().id,`setup`])}back(){this.router.navigate([`/doc`,this.doc().id])}exportMd(){V(this.doc()),this.toast.toast(`Downloaded study sheet (.md)`)}async exportPdf(){let i=this.content?.nativeElement;if(!(this.buildingPdf()||!i||!this.reviewerReady())){this.buildingPdf.set(!0);try{await q(i,this.doc().name),this.toast.toast(`Reviewer PDF downloaded ✓`)}catch{this.toast.toast(`Could not build the PDF`,!0)}finally{this.buildingPdf.set(!1)}}}print(){K$1(this.doc())||this.toast.toast(`Allow pop-ups to print`)}static ɵfac=function(e){return new(e||r$2)};static ɵcmp=Cl({type:r$2,selectors:[[`app-reviewer`]],viewQuery:function(e,t){if(e&1&&Qg(je,5),e&2){let n;bw(n=Tw())&&(t.content=n.first)}},decls:2,vars:2,consts:[[`content`,``],[3,`fullscreen`],[1,`back-header`],[`data-tooltip`,`Back`,1,`icon-btn`,3,`click`,`innerHTML`],[2,`flex`,`1`,`min-width`,`0`],[2,`font-size`,`14px`,`font-weight`,`600`,`white-space`,`nowrap`,`overflow`,`hidden`,`text-overflow`,`ellipsis`],[2,`font-size`,`11.5px`,`color`,`var(--text-faint)`],[1,`font-controls`,2,`display`,`flex`,`gap`,`4px`],[`data-tooltip`,`Smaller text`,1,`icon-btn`,`text-btn`,3,`click`],[`data-tooltip`,`Larger text`,1,`icon-btn`,`text-btn`,3,`click`],[1,`screen`,`rev-screen`],[1,`ai-mode-toggle`],[1,`ai-gen-bar`],[1,`ai-gen-bar`,`err`],[1,`find-bar`],[`type`,`search`,`placeholder`,`Find in document…`,`aria-label`,`Find in document`,`autocomplete`,`off`,1,`text-input`,3,`ngModelChange`,`input`,`keydown`,`ngModel`],[1,`faint`],[`id`,`review-content`,1,`reader`,`summary-mode`,3,`innerHTML`],[1,`reader-actions`],[1,`btn`,`btn-primary`,3,`click`],[3,`innerHTML`],[`data-tooltip`,`Download the exact Reviewer shown on screen as a PDF`,1,`btn`,`btn-primary`,2,`margin-top`,`10px`,`width`,`100%`,3,`click`,`disabled`],[2,`display`,`grid`,`grid-template-columns`,`1fr 1fr`,`gap`,`8px`,`width`,`100%`,`margin-top`,`10px`],[`data-tooltip`,`Download the study sheet as Markdown`,1,`btn`,`btn-secondary`,3,`click`],[`data-tooltip`,`Open a printable study sheet`,1,`btn`,`btn-secondary`,3,`click`],[`type`,`button`,3,`click`],[1,`ai-dot`],[`type`,`button`,1,`ai-retry`,3,`click`]],template:function(e,t){if(e&1&&(xs(0,`ion-content`,1),sw(1,Ue,41,29),Nl()),e&2){let n;Ug(`fullscreen`,!0),uI(),aw((n=t.doc())?1:-1,n)}},dependencies:[Ta,un,Ie$1,on,Ot,p$1],encapsulation:2})};export{De as ReviewerPage};