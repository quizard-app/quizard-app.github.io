import{n as r,r as s}from"./chunk-CCnQ1X3m.js";import{t}from"./chunk-gOF4uCpS.js";import"./chunk-Dqyvoa3d.js";import"./chunk-hh0W7bTI.js";import"./chunk-BgSpcwbd.js";import"./chunk-D4k-zadY.js";import"./chunk-DEURnQ86.js";import"./chunk-CABSGZFi.js";import"./chunk-tv0E5ky_.js";import{At as g,En as zt,It as jg,L as Ml,O as Jg,Ot as fw,Pt as im,Qt as oI,St as dm,Tn as zg,Tt as ew,Vt as lm,W as Pg,Xt as nr,bn as xl,cn as sm,dt as Yw,et as Uf,f as Dw,ft as ZI,hn as vb,i as Aa,jt as hE,m as Ew,mt as Zg,n as $w,nn as pw,on as sS,ot as Ws,rn as qI,s as Bf,un as tw,x as Il,xn as xs,yt as cS}from"./chunk-CDyMuDZS.js";import{r as Ta}from"./chunk-BsNe3t5G.js";import{St as j,_t as m,b as Ht,gt as f,ht as d$1,nt as pe,q as et,rt as qt,st as tt}from"./main-NDCFRQWI.js";import{t as a}from"./chunk-D6aT4yUI.js";import{t as n}from"./chunk-BK5_19Gr.js";import{a as L,f as ee}from"./chunk-4xshH8O8.js";import{h as ut,n as Fe$1}from"./chunk-D3ClhF-6.js";import{t as a$1}from"./chunk-QEftoeRA.js";import{n as Ot,o as on,s as un,t as Ie}from"./chunk-By1fE8Rw.js";import{t as B}from"./chunk-scU34EPR.js";import{a as le,i as fe,n as ce,r as de}from"./chunk-CO8i2VZF.js";var Ve=14e3;var Le=`You are an expert exam reviewer writer. Read the DOCUMENT and produce a complete exam reviewer in strict JSON \u2014 the kind a top student would write by hand to cram from.

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
19. "acronyms" \u2014 every acronym or initialism the DOCUMENT uses (TCP, ATP, LAN, PAPA, HTML...): "acr" is the short form, "expansion" is what the letters stand for, "meaning" is one plain line about what it IS. Max 12, exam-relevant first. Also spell an acronym out inline the first time it appears in a definition or meaning, like "TCP (Transmission Control Protocol)". Empty array when the document has none.`;function d(r){return String(r||``).replace(/\s+/g,` `).trim()}function Oe(r){let e=[[1e3,`M`],[900,`CM`],[500,`D`],[400,`CD`],[100,`C`],[90,`XC`],[50,`L`],[40,`XL`],[10,`X`],[9,`IX`],[5,`V`],[4,`IV`],[1,`I`]],t=``;for(let[i,n]of e)for(;r>=i;)t+=n,r-=i;return t}function K(r,e){let t=r.indexOf(` — `);return t<1?e(r):`<b>${e(r.slice(0,t))}</b> \u2014 ${e(r.slice(t+3))}`}function He(r){if(!r||!Array.isArray(r.parts)||!r.parts.length)return null;let e=[],t=1;for(let a of r.parts){if(!a||!Array.isArray(a.sections)||!a.sections.length)continue;let m=[];for(let s of a.sections){let b=d(s.explanation),C=Array.isArray(s.bullets)?s.bullets.map(d).filter(Boolean):[],R=Array.isArray(s.steps)?s.steps.map(d).filter(Boolean):[],H=Array.isArray(s.terms)?s.terms.map(A=>({term:d(A?.term),meaning:d(A?.meaning).replace(/^meaning:\s*/i,``),bullets:Array.isArray(A?.bullets)?A.bullets.map(d).filter(Boolean):[],memory:d(A?.memory)||null})).filter(A=>A.term&&(A.meaning||A.bullets.length)):[];if(!b&&!C.length&&!R.length&&!H.length)continue;let f=s.table&&Array.isArray(s.table.headers)&&Array.isArray(s.table.rows)&&s.table.rows.length?{headers:s.table.headers.map(d).filter(Boolean),rows:s.table.rows.map(A=>Array.isArray(A)?A.map(d):[]).filter(A=>A.length)}:null,k=Number(s.stars);m.push({num:s.num!=null?Number(s.num):t,heading:d(s.heading)||`Section ${t}`,mustKnow:d(s.mustKnow)||null,stars:Number.isFinite(k)?Math.max(0,Math.min(3,Math.round(k))):null,definition:d(s.definition)||null,explanation:b,terms:H,bullets:C,steps:R,table:f,mnemonic:d(s.mnemonic)||null,important:d(s.important)||null,example:d(s.example)||null,memory:d(s.memory)||null,examClue:d(s.examClue)||null}),t++}if(m.length){let s=(d(a.title)||`PART`).replace(/^PART\s+[IVXLC\d]+\s*[—–-]?\s*/i,``)||`PART`;e.push({title:s,sections:m})}}if(!e.length)return null;let i=Array.isArray(r.highYield)?r.highYield.map(a=>({label:d(a?.label),items:Array.isArray(a?.items)?a.items.map(d).filter(Boolean):[]})).filter(a=>a.label&&a.items.length):[],n=Array.isArray(r.idQuestions)?r.idQuestions.map(a=>({clue:d(a?.clue),answer:d(a?.answer)})).filter(a=>a.clue&&a.answer):[],o=Array.isArray(r.myths)?r.myths.map(a=>({myth:d(a?.myth),fact:d(a?.fact)})).filter(a=>a.myth&&a.fact):[],p=Array.isArray(r.gaps)?r.gaps.map(d).filter(Boolean).slice(0,5):[],c=Array.isArray(r.finalReview)?r.finalReview.map(d).filter(Boolean):[],l=Array.isArray(r.acronyms)?r.acronyms.map(a=>({acr:d(a?.acr).toUpperCase().replace(/[^A-Z0-9]/g,``),expansion:d(a?.expansion),meaning:d(a?.meaning)})).filter(a=>a.acr.length>=2&&a.acr.length<=10&&a.expansion):[],u=new Set,h=l.filter(a=>u.has(a.acr)?!1:(u.add(a.acr),!0)).slice(0,12);return{v:4,title:d(r.title)||`Exam Reviewer`,intro:d(r.intro)||``,acronyms:h,parts:e,idQuestions:n,myths:o,gaps:p,finalReview:c,highYield:i}}function je(r){if(r.length<=Ve)return[r];let e=[],t=r.split(/\n{2,}/),i=``;for(let n of t)(i+`

`+n).length>Ve&&i?(e.push(i),i=n):i=i?i+`

`+n:n;return i&&e.push(i),e.slice(0,3)}async function Ne(r$1){let e=r$1.reviewerAI;if((Array.isArray(e)?e.length:e?.parts?.length)&&e.v===4)return{reviewer:e,cached:!0};let i=String(r$1.text||``).trim();if(i.length<300)return{error:`not_enough_content`};let n=je(i),o=null,p=-1,c=!1;for(let l=0;l<n.length&&!o;l++){let u=n.length>1?`DOCUMENT (part ${l+1} of ${n.length}):

${n[l]}

Cover only the topics in this part.`:`DOCUMENT:

${n[l]}`;try{let h=await j(`${Le}

${u}`,{json:!0,maxOutputTokens:8e3,temperature:.3,timeoutMs:95e3}),a;try{a=JSON.parse(h)}catch{let m=h.match(/\{[\s\S]*\}/);if(m)try{a=JSON.parse(m[0])}catch{a=null}}if(o=He(a),o&&(p=l),!o&&n.length>1)try{o=He(JSON.parse(await j(`${Le}

${u}

Return ONLY valid JSON.`,{json:!0,maxOutputTokens:8e3,temperature:.2,timeoutMs:95e3})))}catch{}}catch(h){let a=String(h?.message||h);if(a.includes(`no_keys_configured`)||a.includes(`origin_not_allowed`))return{error:`relay_unavailable`};/timeout|upstream_timeout|504|abort/i.test(a)&&(c=!0)}}if(!o)return{error:c?`timeout`:`generation_failed`};if(n.length>1){let l=Array.isArray(o.gaps)?o.gaps:[];l.unshift(`This file is long \u2014 the reviewer was built from part ${p+1} of ${n.length}; later sections may be missing.`),o=s(r({},o),{gaps:l.slice(0,6)})}try{await Ht(r$1.id,{reviewerAI:o})}catch{}return{reviewer:o,cached:!1}}function Fe(r,e){let t=e,i=[];i.push(`
    <div class="rvw-head">
      <div class="rvw-eyebrow">\u2726 AI Exam Reviewer</div>
      <h1 class="rvw-title">${t(r.title)}</h1>
      ${r.intro?`<p class="rvw-overview">${t(r.intro)}</p>`:``}
    </div>`);let n=r.acronyms||[];n.length&&i.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">\u{1F511}</span><h3>Key Acronyms</h3></div>
        <p class="ai-hy-intro">What each abbreviation stands for:</p>
        ${n.map(a=>`
          <div class="ai-acr" data-para>
            <span class="ai-acr-badge">${t(a.acr)}</span>
            <span class="ai-acr-body"><b>${t(a.expansion)}</b>${a.meaning?` \u2014 ${t(a.meaning)}`:``}</span>
          </div>`).join(``)}
      </div>`);let o=0;for(let a of r.parts){o++;let m=(a.title||`PART`).replace(/^PART\s+[IVXLC\d]+\s*[—–-]?\s*/i,``)||`PART`;i.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">${Oe(o)}</span><h3>${t(m)}</h3></div>`);for(let s of a.sections){i.push(`<div class="ai-sec">`);let b=s.mustKnow?`<span class="ai-flag ${/VERY/i.test(s.mustKnow)?`hot`:/Important/i.test(s.mustKnow)?`warm`:`cool`}">${t(s.mustKnow)}</span>`:``,C=s.stars?`<span class="ai-stars">`+`⭐`.repeat(Math.min(3,s.stars))+`</span>`:``;if(i.push(`<div class="ai-sec-head"><span class="ai-num">${t(s.num)}</span><h4>${t(s.heading)}${C}</h4>${b}</div>`),s.definition){let f=s.definition.indexOf(`=`);i.push(f>0?`<p class="ai-def"><span class="ai-def-term">${t(s.definition.slice(0,f).trim())}</span> = ${t(s.definition.slice(f+1).trim())}</p>`:`<p class="ai-def">${t(s.definition)}</p>`)}s.explanation&&i.push(`<p class="ai-expl" data-para>${t(s.explanation)}</p>`);for(let f of s.terms||[]){if(i.push(`<div class="ai-term" data-para>`),i.push(`<div class="ai-term-name">\u{1F539} ${t(f.term)}</div>`),f.meaning){let k=f.meaning.replace(/^meaning:\s*/i,``);i.push(`<p class="ai-term-meaning"><span class="ai-term-label">Meaning:</span> ${t(k)}</p>`)}f.bullets&&f.bullets.length&&i.push(`<ul class="ai-bullets">${f.bullets.map(k=>`<li data-para>${K(k,t)}</li>`).join(``)}</ul>`),f.memory&&i.push(`<div class="ai-box ai-memory"><span class="ai-box-label">Memory</span><span>${t(f.memory)}</span></div>`),i.push(`</div>`)}let R=s.bullets||[],H=s.steps||[];R.length&&i.push(`<ul class="ai-bullets">${R.map(f=>`<li data-para>${K(f,t)}</li>`).join(``)}</ul>`),H.length&&i.push(`<ol class="ai-steps">${H.map(f=>`<li data-para>${K(f,t)}</li>`).join(``)}</ol>`),s.table&&i.push(`<table class="ai-table"><thead><tr>${s.table.headers.map(f=>`<th>${t(f)}</th>`).join(``)}</tr></thead><tbody>${s.table.rows.map(f=>`<tr>${f.map(k=>`<td>${t(k)}</td>`).join(``)}</tr>`).join(``)}</tbody></table>`),s.mnemonic&&i.push(`<div class="ai-mnemonic" data-para><span class="ai-mnemonic-label">\u{1F9E0} Memorize</span><span>${t(s.mnemonic)}</span></div>`),s.important&&i.push(`<div class="ai-box ai-important" data-para><span class="ai-box-label">Important</span><span>${t(s.important)}</span></div>`),s.example&&i.push(`<div class="ai-box ai-example" data-para><span class="ai-box-label">Example</span><span>${t(s.example)}</span></div>`),s.memory&&i.push(`<div class="ai-box ai-memory" data-para><span class="ai-box-label">Memory trick</span><span>${t(s.memory)}</span></div>`),s.examClue&&i.push(`<div class="ai-box ai-clue" data-para><span class="ai-box-label">Exam clue</span><span>${t(s.examClue)}</span></div>`),i.push(`</div>`)}i.push(`</div>`)}let p=r.highYield||[];p.length&&i.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">\u{1F525}</span><h3>Super Important Exam Points</h3></div>
        <p class="ai-hy-intro">If you're short on study time, memorize these first:</p>
        ${p.map(a=>`
          <div class="ai-hy">
            <div class="ai-hy-label">${t(a.label)}</div>
            <ul class="ai-bullets">${a.items.map(m=>`<li data-para>${t(m)}</li>`).join(``)}</ul>
          </div>`).join(``)}
      </div>`);let c=r.idQuestions||[];c.length&&i.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">\u{1F4DD}</span><h3>Possible Identification Questions</h3></div>
        ${c.map(a=>`
          <div class="ai-idq" data-para>
            <div class="ai-idq-clue">${t(a.clue)}</div>
            <div class="ai-idq-ans">\u2192 ${t(a.answer)}</div>
          </div>`).join(``)}
      </div>`);let l=r.myths||[];l.length&&i.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">\u2696\uFE0F</span><h3>Myths vs Facts</h3></div>
        ${l.map(a=>`
          <div class="ai-myth" data-para>
            <div class="ai-myth-row bad">\u274C <span>${t(a.myth)}</span></div>
            <div class="ai-myth-row good">\u2705 <span>${t(a.fact)}</span></div>
          </div>`).join(``)}
      </div>`);let u=r.finalReview||[];u.length&&i.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">\u{1F3AF}</span><h3>One-Minute Final Review</h3></div>
        <p class="ai-hy-intro">Before your exam, remember:</p>
        ${u.map(a=>{let m=a.indexOf(`=`);return m>0?`<p class="ai-def" data-para><span class="ai-def-term">${t(a.slice(0,m).trim())}</span> = ${t(a.slice(m+1).trim())}</p>`:`<p class="ai-def" data-para>${t(a)}</p>`}).join(``)}
      </div>`);let h=r.gaps||[];return h.length&&i.push(`
      <div class="ai-gaps" data-para>
        <div class="ai-gaps-head">\u26A0\uFE0F Possibly missing from this reviewer</div>
        <ul>${h.map(a=>`<li>${t(a)}</li>`).join(``)}</ul>
      </div>`),i.push(`<p class="sum-note">AI-generated from your document — always double-check against your original source before the exam.</p>`),i.join(``)}var ze=[`content`];function Be(r,e){if(r&1){let t=fw();xs(0,`div`,12)(1,`button`,26),zg(`click`,function(){Bf(t);return Uf(pw(2).setAiMode(!0))}),Ws(2,`span`,21),sS(3,`ico`),$w(4,` AI reviewer`),Ml(),xs(5,`button`,26),zg(`click`,function(){Bf(t);return Uf(pw(2).setAiMode(!1))}),$w(6,`Quick notes`),Ml()()}if(r&2){let t=pw(2);oI(),Jg(`on`,t.aiMode()),oI(),jg(`innerHTML`,cS(3,5,`sparkles`),hE),oI(3),Jg(`on`,!t.aiMode())}}function Qe(r,e){r&1&&(xs(0,`div`,13),Ws(1,`span`,27),$w(2,` Forging your AI reviewer from this file… usually under a minute. Quick notes shown meanwhile.`),Ml())}function Ue(r,e){if(r&1){let t=fw();xs(0,`div`,14),$w(1,`AI reviewer couldn't be generated`),xs(2,`button`,28),zg(`click`,function(){Bf(t);return Uf(pw(2).retryAi())}),$w(3,`Retry`),Ml(),xs(4,`button`,28),zg(`click`,function(){Bf(t);return Uf(pw(2).byok.open(`The AI relay is busy or out of requests. Add your own free Gemini key to generate the reviewer.`))}),$w(5,`Add a key`),Ml()()}}function Ke(r,e){if(r&1){let t=fw();xs(0,`header`,2)(1,`button`,3),sS(2,`ico`),zg(`click`,function(){Bf(t);return Uf(pw().back())}),Ml(),xs(3,`div`,4)(4,`div`,5),$w(5),Ml(),xs(6,`div`,6),$w(7),Ml()(),xs(8,`div`,7)(9,`button`,8),sS(10,`ico`),zg(`click`,function(){Bf(t);return Uf(pw().toggleFind())}),Ml(),xs(11,`button`,9),zg(`click`,function(){Bf(t);return Uf(pw().fontMinus())}),$w(12,`A−`),Ml(),xs(13,`button`,10),zg(`click`,function(){Bf(t);return Uf(pw().fontPlus())}),$w(14,`A+`),Ml()()(),xs(15,`div`,11),ew(16,Be,7,7,`div`,12),ew(17,Qe,3,0,`div`,13),ew(18,Ue,6,0,`div`,14),xs(19,`div`,15)(20,`input`,16),dm(`ngModelChange`,function(n){Bf(t);let o=pw();return Yw(o.findQuery,n)||(o.findQuery=n),Uf(n)}),zg(`input`,function(){Bf(t);return Uf(pw().runFind())})(`keydown`,function(n){Bf(t);return Uf(pw().onFindKey(n))}),Ml(),qI(),xs(21,`span`,17),$w(22),Ml()(),Ws(23,`article`,18,0),xs(25,`div`,19)(26,`button`,20),zg(`click`,function(){Bf(t);return Uf(pw().quizMe())}),Ws(27,`span`,21),sS(28,`ico`),$w(29,` Quiz me on this`),Ml(),xs(30,`button`,22),zg(`click`,function(){Bf(t);return Uf(pw().exportPdf())}),Ws(31,`span`,21),sS(32,`ico`),$w(33),Ml(),xs(34,`div`,23)(35,`button`,24),zg(`click`,function(){Bf(t);return Uf(pw().exportMd())}),Ws(36,`span`,21),sS(37,`ico`),$w(38,` Export .md`),Ml(),xs(39,`button`,25),zg(`click`,function(){Bf(t);return Uf(pw().print())}),Ws(40,`span`,21),sS(41,`ico`),$w(42,` Print sheet`),Ml()()()()}if(r&2){let t=e,i=pw();oI(),jg(`innerHTML`,cS(2,22,`chevronLeft`),hE),oI(4),im(t.name),oI(2),sm(``,i.typeLabel(t.type),` · `,t.wordCount.toLocaleString(),` words`),oI(2),Jg(`on`,i.findVisible()),jg(`innerHTML`,cS(10,24,`search`),hE),oI(7),tw(i.aiState()===`ready`?16:-1),oI(),tw(i.aiState()===`generating`?17:-1),oI(),tw(i.aiState()===`error`?18:-1),oI(),Jg(`hidden`,!i.findVisible()),oI(),lm(`ngModel`,i.findQuery),ZI(),oI(2),im(i.findCount()),oI(),jg(`innerHTML`,i.contentHtml(),hE),oI(4),jg(`innerHTML`,cS(28,26,`play`),hE),oI(3),jg(`disabled`,i.buildingPdf()||!i.reviewerReady()||i.aiMode()&&i.aiState()===`generating`),Pg(`aria-busy`,i.buildingPdf()),oI(),jg(`innerHTML`,cS(32,28,`download`),hE),oI(2),xl(` `,i.buildingPdf()?`Building PDF…`:i.aiMode()&&i.aiReviewer()?`Export AI Reviewer PDF`:`Export Reviewer PDF`,` `),oI(3),jg(`innerHTML`,cS(37,30,`download`),hE),oI(4),jg(`innerHTML`,cS(41,32,`print`),hE)}}function Y(r,e=3){let t=[];for(let i=0;i<r.length;i+=e)t.push(r.slice(i,i+e));return t.map(i=>i.join(` `))}var Ye=/^(The|This|That|These|Those|It|Its|In|At|On|And|But|For|With|When|After|Today|Just|Only|Most|Many|Both|Each|Such|Then|They|There)$/;var De=class r$2{route=g(zt);router=g(Aa);toast=g(m);ui=g(n);typeLabel=a;qs=g(a$1);byok=g(d$1);sanitizer=g(vb);content;doc=nr(null);contentHtml=nr(``);scale=1;aiReviewer=nr(null);aiState=nr(`idle`);aiMode=nr(!0);aiTried=!1;findVisible=nr(!1);toggleFind(){let e=!this.findVisible();this.findVisible.set(e),e?setTimeout(()=>document.querySelector(`input[aria-label="Find in document"]`)?.focus(),60):(this.findQuery=``,this.clearFind())}findCount=nr(``);reviewerReady=nr(!1);buildingPdf=nr(!1);nlp=null;nlpBuilding=!1;findMatches=[];findPos=-1;get themeIcon(){return this.ui.theme()===`dark`?`sun`:`moon`}ico(e){return t(e)}esc(e){return String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}async load(){let t=await qt(this.route.snapshot.paramMap.get(`id`)||``);if(!t){this.router.navigateByUrl(`/tabs/library`);return}this.reviewerReady.set(!1),this.doc.set(t),t.reviewerAI?.parts?.length&&(this.aiReviewer.set(t.reviewerAI),this.aiState.set(`ready`));let i=tt();this.scale=i.readerScale||1,this.aiMode.set(i.reviewerAiMode!==!1),setTimeout(()=>this.applyView(),0),this.tryGenerateAi()}ngAfterViewInit(){this.load()}buildNlp(){let e=this.doc(),t=L(e.text),i=ee(e.text),n=i.topics,o=i.membership,p=B(e.text),c=[];if(n.length&&t.length){let m=new Map(n.map(b=>[b.title,[]])),s=[];for(let b of t){let C=o.get(b);C&&m.has(C)?m.get(C).push(b):s.push(b)}s.length>=2&&c.push({title:`Overview`,paras:Y(s)});for(let b of n){let C=m.get(b.title);C?.length&&c.push({title:b.title,paras:Y(C)})}}else c.push({title:null,paras:Y(t.length?t:e.text.split(/(?<=[.!?])\s+/))});let l=[],u=new Set;for(let m of p.sections)for(let s of m.terms){let b=s.toLowerCase();if(u.has(b)||l.length>=8)continue;u.add(b);let C=t.find(R=>R.toLowerCase().includes(b)&&R.length>20);C&&l.push({term:s,def:C})}let a=(Fe$1(e,{count:6,mix:r({},ut),difficulty:`medium`,shuffle:!1,fixedSeed:7}).questions||[]).filter(m=>m.type!==`short`);this.nlp={sents:t,topics:n,summary:p,sections:c,keyTermDefs:l,reviewQs:a,readTargets:{summary:p.sections.flatMap(m=>m.points),full:c.flatMap(m=>m.paras)}}}summaryHtml(){let e=this.doc(),{summary:t,sections:i,keyTermDefs:n,reviewQs:o}=this.nlp;if(!t.tldr.length)return`<div class="empty-state"><h3>Not enough to summarize</h3><p>This document has too little readable text. Try the Full text tab.</p></div>`;let p=[];return p.push(`
      <div class="rvw-head">
        <div class="rvw-eyebrow">${this.ico(`book`)} Study Reviewer</div>
        <h1 class="rvw-title">${this.esc(e.name)}</h1>
        <div class="rvw-meta">${a(e.type)} \xB7 ${e.wordCount.toLocaleString()} words \xB7 ${i.length} section${i.length===1?``:`s`} \xB7 ${n.length} key term${n.length===1?``:`s`}</div>
      </div>`),t.tldr.length&&p.push(`
        <div class="rvw-part">
          <div class="rvw-part-head"><span class="rvw-num">I</span><h3>Overview</h3></div>
          ${t.tldr.map(c=>`<p class="rvw-overview" data-point>${this.esc(c)}</p>`).join(``)}
        </div>`),n.length&&p.push(`
        <div class="rvw-part">
          <div class="rvw-part-head"><span class="rvw-num">II</span><h3>Key Terms &amp; Definitions</h3></div>
          <dl class="rvw-terms">
            ${n.map(c=>`<div class="rvw-term"><dt>${this.esc(c.term)}</dt><dd>${this.esc(c.def)}</dd></div>`).join(``)}
          </dl>
        </div>`),t.sections.length&&p.push(`
        <div class="rvw-part">
          <div class="rvw-part-head"><span class="rvw-num">III</span><h3>Section Notes</h3></div>
          ${t.sections.map((c,l)=>`
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
        </div>`),o.length&&p.push(`
        <div class="rvw-part">
          <div class="rvw-part-head"><span class="rvw-num">IV</span><h3>Test Yourself</h3></div>
          <ol class="rvq-list">
            ${o.map(c=>this.selfTestItemHtml(c)).join(``)}
          </ol>
        </div>`),p.join(``)+`<p class="sum-note">Forged from your document — open <strong>Full text</strong> to read everything.</p>`}selfTestItemHtml(e){let t={tf:`TRUE or FALSE`,matching:`MATCHING`,ordering:`ORDERING`},i=``,n=``,o=``,p=(l,u=!1)=>`<div class="rvq-opts">${(l||[]).map((h,a)=>`<span>${u?a+1+`.`:String.fromCharCode(65+a)+`.`} ${this.esc(h)}</span>`).join(``)}</div>`;if(e.type===`mcq`||e.type===`except`)i=(e.type===`except`?`<span class="rvq-tag">EXCEPT</span> `:``)+this.esc(e.stem),n=p(e.options),o=e.options?.[e.answerIndex]??``;else if(e.type===`multi`)i=`<span class="rvq-tag">SELECT 2</span> `+this.esc(e.stem),n=p(e.options),o=(e.answerIndices||[]).map(l=>e.options?.[l]).filter(Boolean).join(` · `);else if(e.type===`tf`)i=`<span class="rvq-tag">T/F</span> ${this.esc(e.statement)}`,o=e.answer?`True`:`False`;else if(e.type===`fib`)i=this.esc(e.stem),n=p(e.choices,!0),o=e.choices?.[e.answerIndex]??``;else if(e.type===`id`)i=`Identify the term: ${this.esc(e.clue)}`,o=e.answer??``;else if(e.type===`matching`)i=`${this.esc(e.prompt)}`,n=`
        <div class="rvq-opts rvq-match">
          <div class="rvq-match-col"><b>Terms</b>${(e.pairs||[]).map(l=>`<span>${this.esc(l.left)}</span>`).join(``)}</div>
          <div class="rvq-match-col"><b>Definitions</b>${(e.rightOrder||[]).map(l=>`<span>${this.esc(e.pairs?.[l]?.right||``)}</span>`).join(``)}</div>
        </div>`,o=(e.pairs||[]).map(l=>`${l.left} \u2192 ${l.right}`).join(` · `);else if(e.type===`ordering`)i=`${this.esc(e.prompt)}`,n=p(e.shuffled||e.steps,!0),o=(e.steps||[]).map((l,u)=>`${u+1}. ${l}`).join(`  ·  `);else return``;return`<li class="rvq">
      <div class="rvq-q">${t[e.type]?`<span class="rvq-tag">${t[e.type]}</span> `:``}${i}${n}</div>
      <details class="rvq-reveal"><summary>Check answer</summary><span>${this.esc(o)}</span></details>
    </li>`}fullHtml(){return this.nlp.sections.map(e=>`
      <section class="reader-section">
        ${e.title?`<h2>${this.esc(e.title)}</h2>`:``}
        ${e.paras.map(t=>`<p data-para>${this.esc(t)}</p>`).join(``)}
      </section>`).join(``)+`<p class="reader-end">· · ·</p>`}trust(e){return this.sanitizer.bypassSecurityTrustHtml(e)}aiReviewHtml(){return Fe(this.aiReviewer(),e=>this.esc(e))}async tryGenerateAi(){if(this.aiTried||this.aiState()===`ready`)return;this.aiTried=!0;let e=this.doc();if(!e?.text||String(e.text).trim().length<300)return;this.aiState.set(`generating`);let t=await Ne(e);if(t.reviewer)this.aiReviewer.set(t.reviewer),this.aiState.set(`ready`),this.byok.notifyAiOk();else if(t.error!==`not_enough_content`)this.aiState.set(`error`),this.byok.notifyAiFailure(t.error||`error`);else{this.aiState.set(`idle`);return}this.applyView()}retryAi(){this.aiState()!==`generating`&&(this.aiTried=!1,this.aiState.set(`idle`),this.tryGenerateAi())}setAiMode(e){this.aiMode.set(e),et({reviewerAiMode:e}),this.applyView()}applyView(){let e=this.content?.nativeElement;if(!e)return;setTimeout(()=>this.applyScale(),0);let t=e.closest(`.rev-screen`)?.querySelector(`.font-controls`);if(!this.nlp){this.contentHtml.set(this.trust(`<div class="reader-loading">Preparing your document…</div>`)),this.nlpBuilding||(this.nlpBuilding=!0,setTimeout(()=>{this.buildNlp(),this.nlpBuilding=!1,this.applyView()},0));return}this.contentHtml.set(this.trust(this.aiMode()&&this.aiReviewer()?this.aiReviewHtml():this.summaryHtml())),this.reviewerReady.set(!0),e.classList.add(`summary-mode`),t&&(t.style.visibility=`hidden`),this.clearFind()}findQuery=``;clearFind(){this.findMatches=[],this.findPos=-1,this.findCount.set(``),this.content?.nativeElement?.querySelectorAll(`mark.find-hit, mark.find-current`).forEach(t=>{let i=t.parentNode;i.replaceChild(document.createTextNode(t.textContent||``),t),i.normalize()})}runFind(){this.clearFind();let e=this.findQuery.trim();if(e.length<2)return;let t=this.content.nativeElement,i=document.createTreeWalker(t,NodeFilter.SHOW_TEXT),n=[];for(;i.nextNode();){let o=i.currentNode;o.nodeValue&&o.nodeValue.toLowerCase().includes(e.toLowerCase())&&n.push(o)}for(let o of n){let p=o.nodeValue||``,c=document.createDocumentFragment(),l=0,u=p.toLowerCase(),h=u.indexOf(e.toLowerCase());for(;h!==-1;){c.appendChild(document.createTextNode(p.slice(l,h)));let a=document.createElement(`mark`);a.className=`find-hit`,a.textContent=p.slice(h,h+e.length),c.appendChild(a),this.findMatches.push(a),l=h+e.length,h=u.indexOf(e.toLowerCase(),l)}c.appendChild(document.createTextNode(p.slice(l))),o.parentNode.replaceChild(c,o)}this.stepFind(0)}onFindKey(e){e.key===`Enter`&&(e.preventDefault(),this.stepFind(e.shiftKey?-1:1)),e.key===`Escape`&&(this.findQuery=``,this.clearFind())}stepFind(e){if(!this.findMatches.length){this.findCount.set(`0/0`);return}this.findPos=e===0?0:(this.findPos+e+this.findMatches.length)%this.findMatches.length,this.findMatches.forEach((t,i)=>t.classList.toggle(`find-current`,i===this.findPos)),this.findCount.set(`${this.findPos+1}/${this.findMatches.length}`),this.findMatches[this.findPos]?.scrollIntoView({block:`center`,behavior:`smooth`})}attachSaveOnPress(){let e=this.content?.nativeElement;e&&e.querySelectorAll(`[data-para]`).forEach(t=>{let i=t,n=null,o=null,p=l=>{l.pointerType===`mouse`&&l.button!==0||(o=null,n=setTimeout(async()=>{o=i;try{let u=(i.textContent||``).trim().slice(0,300),h=this.nlp.keyTermDefs.find(a=>u.toLowerCase().includes(a.term.toLowerCase()))?.term||this.firstKeyPhrase(u);await pe({docId:this.doc().id,sentence:u,term:h,type:`note`}),i.classList.add(`saved-flash`),setTimeout(()=>i.classList.remove(`saved-flash`),900),this.toast.toast(`Saved to your review deck ✦`)}catch{this.toast.toast(`Could not save this line`,!0)}},550))},c=()=>{o===null&&clearTimeout(n)};i.addEventListener(`pointerdown`,p),i.addEventListener(`pointerup`,c),i.addEventListener(`pointerleave`,c),i.addEventListener(`pointercancel`,c)})}firstKeyPhrase(e){let t=e.split(/\s+/).slice(0,6);for(let i=0;i<Math.min(3,t.length);i++){let n=t.slice(i).join(` `).match(/^([A-Z][a-zA-Z'’-]+(?:\s+(?:of|the|de|van|von|da)?[A-Z][a-zA-Z'’-]+)*)/);if(n&&n[1].length>3&&!Ye.test(n[1].split(` `)[0]))return n[1].split(` `).slice(0,3).join(` `)}return t.slice(0,4).join(` `)}applyScale(){let e=this.content?.nativeElement;e&&(e.style.zoom=String(this.scale))}fontMinus(){this.scale=Math.max(.85,+(this.scale-.1).toFixed(2)),et({readerScale:this.scale}),this.applyScale()}fontPlus(){this.scale=Math.min(1.5,+(this.scale+.1).toFixed(2)),et({readerScale:this.scale}),this.applyScale()}quizMe(){this.qs.currentDocId.set(this.doc().id),this.router.navigate([`/doc`,this.doc().id,`setup`])}back(){this.router.navigateByUrl(`/tabs/library`)}exportMd(){de(this.doc()),this.toast.toast(`Downloaded study sheet (.md)`)}async exportPdf(){let e=this.content?.nativeElement;if(!(this.buildingPdf()||!e||!this.reviewerReady())){this.buildingPdf.set(!0);try{this.aiMode()&&this.aiReviewer()?await le(this.aiReviewer(),this.doc().name):await ce(e,this.doc().name),this.toast.toast(`Reviewer PDF downloaded ✓`)}catch{this.toast.toast(`Could not build the PDF`,!0)}finally{this.buildingPdf.set(!1)}}}print(){fe(this.doc())||this.toast.toast(`Allow pop-ups to print`)}static ɵfac=function(t){return new(t||r$2)};static ɵcmp=Il({type:r$2,selectors:[[`app-reviewer`]],viewQuery:function(t,i){if(t&1&&Zg(ze,5),t&2){let n;Dw(n=Ew())&&(i.content=n.first)}},decls:2,vars:2,consts:[[`content`,``],[3,`fullscreen`],[1,`back-header`],[`data-tooltip`,`Back`,1,`icon-btn`,3,`click`,`innerHTML`],[2,`flex`,`1`,`min-width`,`0`],[2,`font-size`,`14px`,`font-weight`,`600`,`white-space`,`nowrap`,`overflow`,`hidden`,`text-overflow`,`ellipsis`],[2,`font-size`,`11.5px`,`color`,`var(--text-faint)`],[1,`font-controls`,2,`display`,`flex`,`gap`,`4px`],[`aria-label`,`Find in document`,`data-tooltip`,`Find in document`,1,`icon-btn`,3,`click`,`innerHTML`],[`data-tooltip`,`Smaller text`,1,`icon-btn`,`text-btn`,3,`click`],[`data-tooltip`,`Larger text`,1,`icon-btn`,`text-btn`,3,`click`],[1,`screen`,`rev-screen`],[1,`ai-mode-toggle`],[1,`ai-gen-bar`],[1,`ai-gen-bar`,`err`],[1,`find-bar`],[`type`,`search`,`placeholder`,`Find in document…`,`aria-label`,`Find in document`,`autocomplete`,`off`,1,`text-input`,3,`ngModelChange`,`input`,`keydown`,`ngModel`],[1,`faint`],[`id`,`review-content`,1,`reader`,`summary-mode`,3,`innerHTML`],[1,`reader-actions`],[1,`btn`,`btn-primary`,3,`click`],[3,`innerHTML`],[`data-tooltip`,`Download the exact Reviewer shown on screen as a PDF`,1,`btn`,`btn-primary`,2,`margin-top`,`10px`,`width`,`100%`,3,`click`,`disabled`],[2,`display`,`grid`,`grid-template-columns`,`1fr 1fr`,`gap`,`8px`,`width`,`100%`,`margin-top`,`10px`],[`data-tooltip`,`Download the study sheet as Markdown`,1,`btn`,`btn-secondary`,3,`click`],[`data-tooltip`,`Open a printable study sheet`,1,`btn`,`btn-secondary`,3,`click`],[`type`,`button`,3,`click`],[1,`ai-dot`],[`type`,`button`,1,`ai-retry`,3,`click`]],template:function(t,i){if(t&1&&(xs(0,`ion-content`,1),ew(1,Ke,43,34),Ml()),t&2){let n;jg(`fullscreen`,!0),oI(),tw((n=i.doc())?1:-1,n)}},dependencies:[Ta,un,Ie,on,Ot,f],encapsulation:2})};export{De as ReviewerPage};