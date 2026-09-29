import{d as v,f as w,h as z}from"./chunk-BTFgPefw.js";import{t}from"./chunk-gOF4uCpS.js";import"./chunk-BbOICyDP.js";import"./chunk-Y8QJL0jr.js";import"./chunk-B1FIQf5i.js";import"./chunk-B-ZaHVBq.js";import"./chunk-foUULV0k.js";import"./chunk-CABSGZFi.js";import"./chunk-Bh3eoH14.js";import{At as g,En as zt,It as jg,L as Ml,O as Jg,Ot as fw,Pt as im,Qt as oI,St as dm,Tn as zg,Tt as ew,Vt as lm,W as Pg,Xt as nr,bn as xl,cn as sm,dt as Yw,et as Uf,f as Dw,ft as ZI,hn as vb,i as Aa,jt as hE,m as Ew,mt as Zg,n as $w,nn as pw,on as sS,ot as Ws,rn as qI,s as Bf,un as tw,x as Il,xn as xs,yt as cS}from"./chunk-voKL8BjL.js";import{r as Ta}from"./chunk-CFGyVmIz.js";import{St as j,_t as m,b as Ht,gt as f,ht as d,nt as pe,q as et$1,rt as qt,st as tt$1}from"./main-OOFY5A4R.js";import{o as K,p as ie,s as M,u as X$1,y as z$1}from"./chunk-DXRPmtQD.js";import{t as B$1}from"./chunk-Bysnahfs.js";import{n as Ot,o as on,s as un,t as Ie}from"./chunk-m1hnM_B3.js";import{t as n}from"./chunk-DrU872KO.js";import{h as ht,s as Pe}from"./chunk-D3rq6eU0.js";import{a as me,l as ue,n as de,s as pe$1}from"./chunk-D6K7EUD9.js";import{t as a}from"./chunk-DxlhlKYy.js";import{t as a$1}from"./chunk-D6aT4yUI2.js";var Be=14e3;var Qe=5;var Ge=2e5;var We=24e3;var Xe=15e4;var Je=8;var je=`You are an expert exam reviewer writer. Read the DOCUMENT and produce a complete exam reviewer in strict JSON \u2014 the kind a top student would write by hand to cram from.

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
1. Cover EVERY major topic in the document, roughly in source order \u2014 do not skip or merge away content. When a DECK OUTLINE is provided, every outline entry must land inside some section: group consecutive slides/pages that teach one thing into a single section, but never drop an entry. Keep the document's own terminology and framework names \u2014 never add unrelated topics.
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
19. "acronyms" \u2014 every acronym or initialism the DOCUMENT uses (TCP, ATP, LAN, PAPA, HTML...): "acr" is the short form, "expansion" is what the letters stand for, "meaning" is one plain line about what it IS. Max 12, exam-relevant first. Also spell an acronym out inline the first time it appears in a definition or meaning, like "TCP (Transmission Control Protocol)". Empty array when the document has none.`;function p(a){return String(a||``).replace(/\s+/g,` `).trim()}function Ze(a){let t=[[1e3,`M`],[900,`CM`],[500,`D`],[400,`CD`],[100,`C`],[90,`XC`],[50,`L`],[40,`XL`],[10,`X`],[9,`IX`],[5,`V`],[4,`IV`],[1,`I`]],e=``;for(let[i,n]of t)for(;a>=i;)e+=n,a-=i;return e}function X(a,t){let e=a.indexOf(` — `);return e<1?t(a):`<b>${t(a.slice(0,e))}</b> \u2014 ${t(a.slice(e+3))}`}function Z(a){if(!a||!Array.isArray(a.parts)||!a.parts.length)return null;let t=[],e=1;for(let r of a.parts){if(!r||!Array.isArray(r.sections)||!r.sections.length)continue;let _=[];for(let s of r.sections){let g=p(s.explanation),b=Array.isArray(s.bullets)?s.bullets.map(p).filter(Boolean):[],A=Array.isArray(s.steps)?s.steps.map(p).filter(Boolean):[],k=Array.isArray(s.terms)?s.terms.map(S=>({term:p(S?.term),meaning:p(S?.meaning).replace(/^meaning:\s*/i,``),bullets:Array.isArray(S?.bullets)?S.bullets.map(p).filter(Boolean):[],memory:p(S?.memory)||null})).filter(S=>S.term&&(S.meaning||S.bullets.length)):[];if(!g&&!b.length&&!A.length&&!k.length)continue;let h=s.table&&Array.isArray(s.table.headers)&&Array.isArray(s.table.rows)&&s.table.rows.length?{headers:s.table.headers.map(p).filter(Boolean),rows:s.table.rows.map(S=>Array.isArray(S)?S.map(p):[]).filter(S=>S.length)}:null,E=Number(s.stars);_.push({num:s.num!=null?Number(s.num):e,heading:p(s.heading)||`Section ${e}`,mustKnow:p(s.mustKnow)||null,stars:Number.isFinite(E)?Math.max(0,Math.min(3,Math.round(E))):null,definition:p(s.definition)||null,explanation:g,terms:k,bullets:b,steps:A,table:h,mnemonic:p(s.mnemonic)||null,important:p(s.important)||null,example:p(s.example)||null,memory:p(s.memory)||null,examClue:p(s.examClue)||null}),e++}if(_.length){let s=(p(r.title)||`PART`).replace(/^PART\s+[IVXLC\d]+\s*[—–-]?\s*/i,``)||`PART`;t.push({title:s,sections:_})}}if(!t.length)return null;let i=Array.isArray(a.highYield)?a.highYield.map(r=>({label:p(r?.label),items:Array.isArray(r?.items)?r.items.map(p).filter(Boolean):[]})).filter(r=>r.label&&r.items.length):[],n=Array.isArray(a.idQuestions)?a.idQuestions.map(r=>({clue:p(r?.clue),answer:p(r?.answer)})).filter(r=>r.clue&&r.answer):[],o=Array.isArray(a.myths)?a.myths.map(r=>({myth:p(r?.myth),fact:p(r?.fact)})).filter(r=>r.myth&&r.fact):[],l=Array.isArray(a.gaps)?a.gaps.map(p).filter(Boolean).slice(0,5):[],d=Array.isArray(a.finalReview)?a.finalReview.map(p).filter(Boolean):[],c=Array.isArray(a.acronyms)?a.acronyms.map(r=>({acr:p(r?.acr).toUpperCase().replace(/[^A-Z0-9]/g,``),expansion:p(r?.expansion),meaning:p(r?.meaning)})).filter(r=>r.acr.length>=2&&r.acr.length<=10&&r.expansion):[],m=new Set,v=c.filter(r=>m.has(r.acr)?!1:(m.add(r.acr),!0)).slice(0,12);return{v:Qe,title:p(a.title)||`Exam Reviewer`,intro:p(a.intro)||``,acronyms:v,parts:t,idQuestions:n,myths:o,gaps:l,finalReview:d,highYield:i}}function qe(a,t){if(a.length<=Be)return[a];let e=[],i=a.split(/\n{2,}/),n=``;for(let o of i)(n+`

`+o).length>Be&&n?(e.push(n),n=o):n=n?n+`

`+o:o;return n&&e.push(n),e.slice(0,t)}function ze(a){try{return JSON.parse(a)}catch{let t=String(a||``).match(/\{[\s\S]*\}/);if(t)try{return JSON.parse(t[0])}catch{}}return null}var B=class extends Error{};async function J(a,t,e,i){let n;try{n=await j(a,{json:!0,maxOutputTokens:t,temperature:.3,timeoutMs:e})}catch(l){let d=String(l?.message||l);if(d.includes(`no_keys_configured`)||d.includes(`origin_not_allowed`))throw new B(d);return/timeout|upstream_timeout|504|abort/i.test(d)&&(i.timeoutSeen=!0),null}let o=Z(ze(n));if(o)return o;try{return Z(ze(await j(`${a}

Return ONLY valid JSON \u2014 no prose before or after, and do not cut the JSON short.`,{json:!0,maxOutputTokens:t,temperature:.2,timeoutMs:e})))}catch(l){let d=String(l?.message||l);if(d.includes(`no_keys_configured`)||d.includes(`origin_not_allowed`))throw new B(d);return/timeout|upstream_timeout|504|abort/i.test(d)&&(i.timeoutSeen=!0),null}}function et(a){if(!a.length)return null;return Z(w(v({},a[0]),{parts:a.flatMap(e=>e.parts||[]).map(e=>({title:e.title,sections:(e.sections||[]).map(o=>{var l=o,{num:i}=l;return z(l,[`num`])})})),highYield:a.flatMap(e=>e.highYield||[]).slice(0,10),idQuestions:a.flatMap(e=>e.idQuestions||[]).slice(0,14),myths:a.flatMap(e=>e.myths||[]).slice(0,8),finalReview:a.flatMap(e=>e.finalReview||[]).slice(0,12),acronyms:a.flatMap(e=>e.acronyms||[]),gaps:a.flatMap(e=>e.gaps||[])}))}async function Ue(a,{force:t=!1}={}){let e=a.reviewerAI,i=Array.isArray(e)?e.length:e?.parts?.length;if(!t&&i&&e.v===Qe)return{reviewer:e,cached:!0};let n=String(a.text||``).trim();if(n.length<300)return{error:`not_enough_content`};let o={timeoutSeen:!1},l=null;try{if(n.length<=Ge){let c=K(n);l=await J(`${je}${c?`

DECK OUTLINE (slide/page \u2192 its title):
${c}
Every outline entry must be covered by some section.
`:``}

DOCUMENT (complete):

${n}`,We,Xe,o)}if(!l){let c=qe(n,Je);if(c.length===1)l=await J(`${je}

DOCUMENT:

${c[0]}`,8e3,95e3,o);else{let m=new Array(c.length).fill(null),v$1=0,r=Array.from({length:Math.min(3,c.length)},async()=>{for(;v$1<c.length;){let s=v$1++,g=`DOCUMENT (part ${s+1} of ${c.length}):

${c[s]}

Cover only the topics in this part.`;m[s]=await J(g,8e3,95e3,o)}});await Promise.all(r);let _=m.filter(Boolean);if(_.length){l=et(_);let s=m.filter(g=>g===null).length;if(s){let g=Array.isArray(l.gaps)?l.gaps:[];g.unshift(`${s} of ${c.length} document parts could not be reviewed \u2014 regenerate for another try.`),l=w(v({},l),{gaps:g.slice(0,6)})}}}}}catch(c){if(c instanceof B)return{error:`relay_unavailable`};throw c}if(!l)return{error:o.timeoutSeen?`timeout`:`generation_failed`};let d=X$1(n);d&&(l=w(v({},l),{coverage:{slides:d,parts:l.parts.length}}));try{await Ht(a.id,{reviewerAI:l})}catch{}return{reviewer:l,cached:!1}}function Ke(a,t){let e=t,i=[];i.push(`
    <div class="rvw-head">
      <div class="rvw-eyebrow">\u2726 AI Exam Reviewer</div>
      <h1 class="rvw-title">${e(a.title)}</h1>
      ${a.intro?`<p class="rvw-overview">${e(a.intro)}</p>`:``}
    </div>`);let n=a.acronyms||[];n.length&&i.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">\u{1F511}</span><h3>Key Acronyms</h3></div>
        <p class="ai-hy-intro">What each abbreviation stands for:</p>
        ${n.map(r=>`
          <div class="ai-acr" data-para>
            <span class="ai-acr-badge">${e(r.acr)}</span>
            <span class="ai-acr-body"><b>${e(r.expansion)}</b>${r.meaning?` \u2014 ${e(r.meaning)}`:``}</span>
          </div>`).join(``)}
      </div>`);let o=0;for(let r of a.parts){o++;let _=(r.title||`PART`).replace(/^PART\s+[IVXLC\d]+\s*[—–-]?\s*/i,``)||`PART`;i.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">${Ze(o)}</span><h3>${e(_)}</h3></div>`);for(let s of r.sections){i.push(`<div class="ai-sec">`);let g=s.mustKnow?`<span class="ai-flag ${/VERY/i.test(s.mustKnow)?`hot`:/Important/i.test(s.mustKnow)?`warm`:`cool`}">${e(s.mustKnow)}</span>`:``,b=s.stars?`<span class="ai-stars">`+`⭐`.repeat(Math.min(3,s.stars))+`</span>`:``;if(i.push(`<div class="ai-sec-head"><span class="ai-num">${e(s.num)}</span><h4>${e(s.heading)}${b}</h4>${g}</div>`),s.definition){let h=s.definition.indexOf(`=`);i.push(h>0?`<p class="ai-def"><span class="ai-def-term">${e(s.definition.slice(0,h).trim())}</span> = ${e(s.definition.slice(h+1).trim())}</p>`:`<p class="ai-def">${e(s.definition)}</p>`)}s.explanation&&i.push(`<p class="ai-expl" data-para>${e(s.explanation)}</p>`);for(let h of s.terms||[]){if(i.push(`<div class="ai-term" data-para>`),i.push(`<div class="ai-term-name">\u{1F539} ${e(h.term)}</div>`),h.meaning){let E=h.meaning.replace(/^meaning:\s*/i,``);i.push(`<p class="ai-term-meaning"><span class="ai-term-label">Meaning:</span> ${e(E)}</p>`)}h.bullets&&h.bullets.length&&i.push(`<ul class="ai-bullets">${h.bullets.map(E=>`<li data-para>${X(E,e)}</li>`).join(``)}</ul>`),h.memory&&i.push(`<div class="ai-box ai-memory"><span class="ai-box-label">Memory</span><span>${e(h.memory)}</span></div>`),i.push(`</div>`)}let A=s.bullets||[],k=s.steps||[];A.length&&i.push(`<ul class="ai-bullets">${A.map(h=>`<li data-para>${X(h,e)}</li>`).join(``)}</ul>`),k.length&&i.push(`<ol class="ai-steps">${k.map(h=>`<li data-para>${X(h,e)}</li>`).join(``)}</ol>`),s.table&&i.push(`<table class="ai-table"><thead><tr>${s.table.headers.map(h=>`<th>${e(h)}</th>`).join(``)}</tr></thead><tbody>${s.table.rows.map(h=>`<tr>${h.map(E=>`<td>${e(E)}</td>`).join(``)}</tr>`).join(``)}</tbody></table>`),s.mnemonic&&i.push(`<div class="ai-mnemonic" data-para><span class="ai-mnemonic-label">\u{1F9E0} Memorize</span><span>${e(s.mnemonic)}</span></div>`),s.important&&i.push(`<div class="ai-box ai-important" data-para><span class="ai-box-label">Important</span><span>${e(s.important)}</span></div>`),s.example&&i.push(`<div class="ai-box ai-example" data-para><span class="ai-box-label">Example</span><span>${e(s.example)}</span></div>`),s.memory&&i.push(`<div class="ai-box ai-memory" data-para><span class="ai-box-label">Memory trick</span><span>${e(s.memory)}</span></div>`),s.examClue&&i.push(`<div class="ai-box ai-clue" data-para><span class="ai-box-label">Exam clue</span><span>${e(s.examClue)}</span></div>`),i.push(`</div>`)}i.push(`</div>`)}let l=a.highYield||[];l.length&&i.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">\u{1F525}</span><h3>Super Important Exam Points</h3></div>
        <p class="ai-hy-intro">If you're short on study time, memorize these first:</p>
        ${l.map(r=>`
          <div class="ai-hy">
            <div class="ai-hy-label">${e(r.label)}</div>
            <ul class="ai-bullets">${r.items.map(_=>`<li data-para>${e(_)}</li>`).join(``)}</ul>
          </div>`).join(``)}
      </div>`);let d=a.idQuestions||[];d.length&&i.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">\u{1F4DD}</span><h3>Possible Identification Questions</h3></div>
        ${d.map(r=>`
          <div class="ai-idq" data-para>
            <div class="ai-idq-clue">${e(r.clue)}</div>
            <div class="ai-idq-ans">\u2192 ${e(r.answer)}</div>
          </div>`).join(``)}
      </div>`);let c=a.myths||[];c.length&&i.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">\u2696\uFE0F</span><h3>Myths vs Facts</h3></div>
        ${c.map(r=>`
          <div class="ai-myth" data-para>
            <div class="ai-myth-row bad">\u274C <span>${e(r.myth)}</span></div>
            <div class="ai-myth-row good">\u2705 <span>${e(r.fact)}</span></div>
          </div>`).join(``)}
      </div>`);let m=a.finalReview||[];m.length&&i.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">\u{1F3AF}</span><h3>One-Minute Final Review</h3></div>
        <p class="ai-hy-intro">Before your exam, remember:</p>
        ${m.map(r=>{let _=r.indexOf(`=`);return _>0?`<p class="ai-def" data-para><span class="ai-def-term">${e(r.slice(0,_).trim())}</span> = ${e(r.slice(_+1).trim())}</p>`:`<p class="ai-def" data-para>${e(r)}</p>`}).join(``)}
      </div>`);let v=a.gaps||[];return v.length&&i.push(`
      <div class="ai-gaps" data-para>
        <div class="ai-gaps-head">\u26A0\uFE0F Possibly missing from this reviewer</div>
        <ul>${v.map(r=>`<li>${e(r)}</li>`).join(``)}</ul>
      </div>`),i.push(`<p class="sum-note">AI-generated from your document — always double-check against your original source before the exam.</p>`),i.join(``)}var tt=[`content`];function it(a,t){if(a&1){let e=fw();xs(0,`div`,12)(1,`button`,27),zg(`click`,function(){Bf(e);return Uf(pw(2).setAiMode(!0))}),Ws(2,`span`,22),sS(3,`ico`),$w(4,` AI reviewer`),Ml(),xs(5,`button`,27),zg(`click`,function(){Bf(e);return Uf(pw(2).setAiMode(!1))}),$w(6,`Quick notes`),Ml()()}if(a&2){let e=pw(2);oI(),Jg(`on`,e.aiMode()),oI(),jg(`innerHTML`,cS(3,5,`sparkles`),hE),oI(3),Jg(`on`,!e.aiMode())}}function nt(a,t){a&1&&(xs(0,`p`,13),$w(1),Ml()),a&2&&(oI(),xl(`✓ `,t))}function at(a,t){a&1&&(xs(0,`div`,14),Ws(1,`span`,28),$w(2,` Forging your AI reviewer from this file… usually under a minute. Quick notes shown meanwhile.`),Ml())}function st(a,t){if(a&1){let e=fw();xs(0,`div`,15),$w(1,`AI reviewer couldn't be generated`),xs(2,`button`,29),zg(`click`,function(){Bf(e);return Uf(pw(2).retryAi())}),$w(3,`Retry`),Ml(),xs(4,`button`,29),zg(`click`,function(){Bf(e);return Uf(pw(2).byok.open(`The AI relay is busy or out of requests. Add your own free Gemini key to generate the reviewer.`))}),$w(5,`Add a key`),Ml()()}}function rt(a,t){if(a&1){let e=fw();xs(0,`header`,2)(1,`button`,3),sS(2,`ico`),zg(`click`,function(){Bf(e);return Uf(pw().back())}),Ml(),xs(3,`div`,4)(4,`div`,5),$w(5),Ml(),xs(6,`div`,6),$w(7),Ml()(),xs(8,`div`,7)(9,`button`,8),sS(10,`ico`),zg(`click`,function(){Bf(e);return Uf(pw().toggleFind())}),Ml(),xs(11,`button`,9),zg(`click`,function(){Bf(e);return Uf(pw().fontMinus())}),$w(12,`A−`),Ml(),xs(13,`button`,10),zg(`click`,function(){Bf(e);return Uf(pw().fontPlus())}),$w(14,`A+`),Ml()()(),xs(15,`div`,11),ew(16,it,7,7,`div`,12),ew(17,nt,2,1,`p`,13),ew(18,at,3,0,`div`,14),ew(19,st,6,0,`div`,15),xs(20,`div`,16)(21,`input`,17),dm(`ngModelChange`,function(n){Bf(e);let o=pw();return Yw(o.findQuery,n)||(o.findQuery=n),Uf(n)}),zg(`input`,function(){Bf(e);return Uf(pw().runFind())})(`keydown`,function(n){Bf(e);return Uf(pw().onFindKey(n))}),Ml(),qI(),xs(22,`span`,18),$w(23),Ml()(),Ws(24,`article`,19,0),xs(26,`div`,20)(27,`button`,21),zg(`click`,function(){Bf(e);return Uf(pw().quizMe())}),Ws(28,`span`,22),sS(29,`ico`),$w(30,` Quiz me on this`),Ml(),xs(31,`button`,23),zg(`click`,function(){Bf(e);return Uf(pw().exportPdf())}),Ws(32,`span`,22),sS(33,`ico`),$w(34),Ml(),xs(35,`div`,24)(36,`button`,25),zg(`click`,function(){Bf(e);return Uf(pw().exportMd())}),Ws(37,`span`,22),sS(38,`ico`),$w(39,` Export .md`),Ml(),xs(40,`button`,26),zg(`click`,function(){Bf(e);return Uf(pw().print())}),Ws(41,`span`,22),sS(42,`ico`),$w(43,` Print sheet`),Ml()()()()}if(a&2){let e,i=t,n=pw();oI(),jg(`innerHTML`,cS(2,23,`chevronLeft`),hE),oI(4),im(i.name),oI(2),sm(``,n.typeLabel(i.type),` · `,i.wordCount.toLocaleString(),` words`),oI(2),Jg(`on`,n.findVisible()),jg(`innerHTML`,cS(10,25,`search`),hE),oI(7),tw(n.aiState()===`ready`?16:-1),oI(),tw((e=n.coverage())?17:-1,e),oI(),tw(n.aiState()===`generating`?18:-1),oI(),tw(n.aiState()===`error`?19:-1),oI(),Jg(`hidden`,!n.findVisible()),oI(),lm(`ngModel`,n.findQuery),ZI(),oI(2),im(n.findCount()),oI(),jg(`innerHTML`,n.contentHtml(),hE),oI(4),jg(`innerHTML`,cS(29,27,`play`),hE),oI(3),jg(`disabled`,n.buildingPdf()||!n.reviewerReady()||n.aiMode()&&n.aiState()===`generating`),Pg(`aria-busy`,n.buildingPdf()),oI(),jg(`innerHTML`,cS(33,29,`download`),hE),oI(2),xl(` `,n.buildingPdf()?`Building PDF…`:n.aiMode()&&n.aiReviewer()?`Export AI Reviewer PDF`:`Export Reviewer PDF`,` `),oI(3),jg(`innerHTML`,cS(38,31,`download`),hE),oI(4),jg(`innerHTML`,cS(42,33,`print`),hE)}}function q(a,t=3){let e=[];for(let i=0;i<a.length;i+=t)e.push(a.slice(i,i+t));return e.map(i=>i.join(` `))}var ot=/^(The|This|That|These|Those|It|Its|In|At|On|And|But|For|With|When|After|Today|Just|Only|Most|Many|Both|Each|Such|Then|They|There)$/;var Ye=class a$2{route=g(zt);router=g(Aa);toast=g(m);ui=g(n);typeLabel=a$1;qs=g(a);byok=g(d);sanitizer=g(vb);content;doc=nr(null);contentHtml=nr(``);scale=1;aiReviewer=nr(null);aiState=nr(`idle`);aiMode=nr(!0);aiTried=!1;genBusy=!1;coverage=nr(``);findVisible=nr(!1);toggleFind(){let t=!this.findVisible();this.findVisible.set(t),t?setTimeout(()=>document.querySelector(`input[aria-label="Find in document"]`)?.focus(),60):(this.findQuery=``,this.clearFind())}findCount=nr(``);reviewerReady=nr(!1);buildingPdf=nr(!1);nlp=null;nlpBuilding=!1;findMatches=[];findPos=-1;get themeIcon(){return this.ui.theme()===`dark`?`sun`:`moon`}ico(t$1){return t(t$1)}esc(t){return String(t).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}async load(){let e=await qt(this.route.snapshot.paramMap.get(`id`)||``);if(!e){this.router.navigateByUrl(`/tabs/library`);return}this.reviewerReady.set(!1),this.doc.set(e),e.reviewerAI?.parts?.length&&(this.aiReviewer.set(e.reviewerAI),this.aiState.set(`ready`),this.coverage.set(this.computeCoverage(e,e.reviewerAI)));let i=tt$1();this.scale=i.readerScale||1,this.aiMode.set(i.reviewerAiMode!==!1),setTimeout(()=>this.applyView(),0),this.tryGenerateAi()}ngAfterViewInit(){this.load()}buildNlp(){let t=this.doc(),e=z$1(String(t.text||``)),i=M(e),n=ie(e),o=n.topics,l=n.membership,d=B$1(e),c=[];if(o.length&&i.length){let s=new Map(o.map(b=>[b.title,[]])),g=[];for(let b of i){let A=l.get(b);A&&s.has(A)?s.get(A).push(b):g.push(b)}g.length>=2&&c.push({title:`Overview`,paras:q(g)});for(let b of o){let A=s.get(b.title);A?.length&&c.push({title:b.title,paras:q(A)})}}else c.push({title:null,paras:q(i.length?i:e.split(new RegExp(`(?<=[.!?])\\s+`)))});let m=[],v$2=new Set;for(let s of d.sections)for(let g of s.terms){let b=g.toLowerCase();if(v$2.has(b)||m.length>=8)continue;v$2.add(b);let A=i.find(k=>k.toLowerCase().includes(b)&&k.length>20);A&&m.push({term:g,def:A})}let _=(Pe(t,{count:6,mix:v({},ht),difficulty:`medium`,shuffle:!1,fixedSeed:7}).questions||[]).filter(s=>s.type!==`short`);this.nlp={sents:i,topics:o,summary:d,sections:c,keyTermDefs:m,reviewQs:_,readTargets:{summary:d.sections.flatMap(s=>s.points),full:c.flatMap(s=>s.paras)}}}summaryHtml(){let t=this.doc(),{summary:e,sections:i,keyTermDefs:n,reviewQs:o}=this.nlp;if(!e.tldr.length)return`<div class="empty-state"><h3>Not enough to summarize</h3><p>This document has too little readable text. Try the Full text tab.</p></div>`;let l=[];return l.push(`
      <div class="rvw-head">
        <div class="rvw-eyebrow">${this.ico(`book`)} Study Reviewer</div>
        <h1 class="rvw-title">${this.esc(t.name)}</h1>
        <div class="rvw-meta">${a$1(t.type)} \xB7 ${t.wordCount.toLocaleString()} words \xB7 ${i.length} section${i.length===1?``:`s`} \xB7 ${n.length} key term${n.length===1?``:`s`}</div>
      </div>`),e.tldr.length&&l.push(`
        <div class="rvw-part">
          <div class="rvw-part-head"><span class="rvw-num">I</span><h3>Overview</h3></div>
          ${e.tldr.map(d=>`<p class="rvw-overview" data-point>${this.esc(d)}</p>`).join(``)}
        </div>`),n.length&&l.push(`
        <div class="rvw-part">
          <div class="rvw-part-head"><span class="rvw-num">II</span><h3>Key Terms &amp; Definitions</h3></div>
          <dl class="rvw-terms">
            ${n.map(d=>`<div class="rvw-term"><dt>${this.esc(d.term)}</dt><dd>${this.esc(d.def)}</dd></div>`).join(``)}
          </dl>
        </div>`),e.sections.length&&l.push(`
        <div class="rvw-part">
          <div class="rvw-part-head"><span class="rvw-num">III</span><h3>Section Notes</h3></div>
          ${e.sections.map((d,c)=>`
            <div class="sum-section">
              <div class="sum-head">
                <span class="sum-num">${String(c+1).padStart(2,`0`)}</span>
                <h4>${this.esc(d.title)}</h4>
                <span class="chip-count">${d.sentenceCount} sentence${d.sentenceCount===1?``:`s`}</span>
              </div>
              <ul class="sum-points">
                ${d.points.map(m=>`<li>${this.esc(m)}</li>`).join(``)}
              </ul>
            </div>`).join(``)}
        </div>`),o.length&&l.push(`
        <div class="rvw-part">
          <div class="rvw-part-head"><span class="rvw-num">IV</span><h3>Test Yourself</h3></div>
          <ol class="rvq-list">
            ${o.map(d=>this.selfTestItemHtml(d)).join(``)}
          </ol>
        </div>`),l.join(``)+`<p class="sum-note">Forged from your document — open <strong>Full text</strong> to read everything.</p>`}selfTestItemHtml(t){let e={tf:`TRUE or FALSE`,matching:`MATCHING`,ordering:`ORDERING`},i=``,n=``,o=``,l=(c,m=!1)=>`<div class="rvq-opts">${(c||[]).map((v,r)=>`<span>${m?r+1+`.`:String.fromCharCode(65+r)+`.`} ${this.esc(v)}</span>`).join(``)}</div>`;if(t.type===`mcq`||t.type===`except`)i=(t.type===`except`?`<span class="rvq-tag">EXCEPT</span> `:``)+this.esc(t.stem),n=l(t.options),o=t.options?.[t.answerIndex]??``;else if(t.type===`multi`)i=`<span class="rvq-tag">SELECT 2</span> `+this.esc(t.stem),n=l(t.options),o=(t.answerIndices||[]).map(c=>t.options?.[c]).filter(Boolean).join(` · `);else if(t.type===`tf`)i=`<span class="rvq-tag">T/F</span> ${this.esc(t.statement)}`,o=t.answer?`True`:`False`;else if(t.type===`fib`)i=this.esc(t.stem),n=l(t.choices,!0),o=t.choices?.[t.answerIndex]??``;else if(t.type===`id`)i=`Identify the term: ${this.esc(t.clue)}`,o=t.answer??``;else if(t.type===`matching`)i=`${this.esc(t.prompt)}`,n=`
        <div class="rvq-opts rvq-match">
          <div class="rvq-match-col"><b>Terms</b>${(t.pairs||[]).map(c=>`<span>${this.esc(c.left)}</span>`).join(``)}</div>
          <div class="rvq-match-col"><b>Definitions</b>${(t.rightOrder||[]).map(c=>`<span>${this.esc(t.pairs?.[c]?.right||``)}</span>`).join(``)}</div>
        </div>`,o=(t.pairs||[]).map(c=>`${c.left} \u2192 ${c.right}`).join(` · `);else if(t.type===`ordering`)i=`${this.esc(t.prompt)}`,n=l(t.shuffled||t.steps,!0),o=(t.steps||[]).map((c,m)=>`${m+1}. ${c}`).join(`  ·  `);else return``;return`<li class="rvq">
      <div class="rvq-q">${e[t.type]?`<span class="rvq-tag">${e[t.type]}</span> `:``}${i}${n}</div>
      <details class="rvq-reveal"><summary>Check answer</summary><span>${this.esc(o)}</span></details>
    </li>`}fullHtml(){return this.nlp.sections.map(t=>`
      <section class="reader-section">
        ${t.title?`<h2>${this.esc(t.title)}</h2>`:``}
        ${t.paras.map(e=>`<p data-para>${this.esc(e)}</p>`).join(``)}
      </section>`).join(``)+`<p class="reader-end">· · ·</p>`}trust(t){return this.sanitizer.bypassSecurityTrustHtml(t)}aiReviewHtml(){return Ke(this.aiReviewer(),t=>this.esc(t))}async tryGenerateAi(t=!1){if(this.aiTried||this.aiState()===`ready`&&!t||this.genBusy)return;this.aiTried=!0;let e=this.doc();if(!e?.text||String(e.text).trim().length<300)return;this.genBusy=!0,this.aiState.set(`generating`);let i=await Ue(e,{force:t});if(this.genBusy=!1,i.reviewer)this.aiReviewer.set(i.reviewer),this.aiState.set(`ready`),this.coverage.set(this.computeCoverage(e,i.reviewer)),this.byok.notifyAiOk();else if(i.error!==`not_enough_content`)this.aiState.set(`error`),this.byok.notifyAiFailure(i.error||`error`);else{this.aiState.set(`idle`);return}this.applyView()}retryAi(){this.genBusy||(this.aiTried=!1,this.aiState.set(`idle`),this.tryGenerateAi(!0))}computeCoverage(t,e){try{let i=X$1(t?.text),n=e?.parts?.length||0;if(i)return`Covers slides ${i} \xB7 ${n} part${n===1?``:`s`}`;if(n)return`${n} part${n===1?``:`s`} covering the full document`}catch{}return``}setAiMode(t){this.aiMode.set(t),et$1({reviewerAiMode:t}),this.applyView()}applyView(){let t=this.content?.nativeElement;if(!t)return;setTimeout(()=>this.applyScale(),0);let e=t.closest(`.rev-screen`)?.querySelector(`.font-controls`);if(!this.nlp){this.contentHtml.set(this.trust(`<div class="reader-loading">Preparing your document…</div>`)),this.nlpBuilding||(this.nlpBuilding=!0,setTimeout(()=>{this.buildNlp(),this.nlpBuilding=!1,this.applyView()},0));return}this.contentHtml.set(this.trust(this.aiMode()&&this.aiReviewer()?this.aiReviewHtml():this.summaryHtml())),this.reviewerReady.set(!0),t.classList.add(`summary-mode`),e&&(e.style.visibility=`hidden`),this.clearFind()}findQuery=``;clearFind(){this.findMatches=[],this.findPos=-1,this.findCount.set(``),this.content?.nativeElement?.querySelectorAll(`mark.find-hit, mark.find-current`).forEach(e=>{let i=e.parentNode;i.replaceChild(document.createTextNode(e.textContent||``),e),i.normalize()})}runFind(){this.clearFind();let t=this.findQuery.trim();if(t.length<2)return;let e=this.content.nativeElement,i=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),n=[];for(;i.nextNode();){let o=i.currentNode;o.nodeValue&&o.nodeValue.toLowerCase().includes(t.toLowerCase())&&n.push(o)}for(let o of n){let l=o.nodeValue||``,d=document.createDocumentFragment(),c=0,m=l.toLowerCase(),v=m.indexOf(t.toLowerCase());for(;v!==-1;){d.appendChild(document.createTextNode(l.slice(c,v)));let r=document.createElement(`mark`);r.className=`find-hit`,r.textContent=l.slice(v,v+t.length),d.appendChild(r),this.findMatches.push(r),c=v+t.length,v=m.indexOf(t.toLowerCase(),c)}d.appendChild(document.createTextNode(l.slice(c))),o.parentNode.replaceChild(d,o)}this.stepFind(0)}onFindKey(t){t.key===`Enter`&&(t.preventDefault(),this.stepFind(t.shiftKey?-1:1)),t.key===`Escape`&&(this.findQuery=``,this.clearFind())}stepFind(t){if(!this.findMatches.length){this.findCount.set(`0/0`);return}this.findPos=t===0?0:(this.findPos+t+this.findMatches.length)%this.findMatches.length,this.findMatches.forEach((e,i)=>e.classList.toggle(`find-current`,i===this.findPos)),this.findCount.set(`${this.findPos+1}/${this.findMatches.length}`),this.findMatches[this.findPos]?.scrollIntoView({block:`center`,behavior:`smooth`})}attachSaveOnPress(){let t=this.content?.nativeElement;t&&t.querySelectorAll(`[data-para]`).forEach(e=>{let i=e,n=null,o=null,l=c=>{c.pointerType===`mouse`&&c.button!==0||(o=null,n=setTimeout(async()=>{o=i;try{let m=(i.textContent||``).trim().slice(0,300),v=this.nlp.keyTermDefs.find(r=>m.toLowerCase().includes(r.term.toLowerCase()))?.term||this.firstKeyPhrase(m);await pe({docId:this.doc().id,sentence:m,term:v,type:`note`}),i.classList.add(`saved-flash`),setTimeout(()=>i.classList.remove(`saved-flash`),900),this.toast.toast(`Saved to your review deck ✦`)}catch{this.toast.toast(`Could not save this line`,!0)}},550))},d=()=>{o===null&&clearTimeout(n)};i.addEventListener(`pointerdown`,l),i.addEventListener(`pointerup`,d),i.addEventListener(`pointerleave`,d),i.addEventListener(`pointercancel`,d)})}firstKeyPhrase(t){let e=t.split(/\s+/).slice(0,6);for(let i=0;i<Math.min(3,e.length);i++){let n=e.slice(i).join(` `).match(/^([A-Z][a-zA-Z'’-]+(?:\s+(?:of|the|de|van|von|da)?[A-Z][a-zA-Z'’-]+)*)/);if(n&&n[1].length>3&&!ot.test(n[1].split(` `)[0]))return n[1].split(` `).slice(0,3).join(` `)}return e.slice(0,4).join(` `)}applyScale(){let t=this.content?.nativeElement;t&&(t.style.zoom=String(this.scale),t.style.width=(100/this.scale).toFixed(4)+`%`)}fontMinus(){this.scale=Math.max(.85,+(this.scale-.1).toFixed(2)),et$1({readerScale:this.scale}),this.applyScale()}fontPlus(){this.scale=Math.min(1.5,+(this.scale+.1).toFixed(2)),et$1({readerScale:this.scale}),this.applyScale()}quizMe(){this.qs.currentDocId.set(this.doc().id),this.router.navigate([`/doc`,this.doc().id,`setup`])}back(){this.router.navigateByUrl(`/tabs/library`)}exportMd(){ue(this.doc()),this.toast.toast(`Downloaded study sheet (.md)`)}async exportPdf(){let t=this.content?.nativeElement;if(!(this.buildingPdf()||!t||!this.reviewerReady())){this.buildingPdf.set(!0);try{this.aiMode()&&this.aiReviewer()?await pe$1(this.aiReviewer(),this.doc().name):await de(t,this.doc().name),this.toast.toast(`Reviewer PDF downloaded ✓`)}catch{this.toast.toast(`Could not build the PDF`,!0)}finally{this.buildingPdf.set(!1)}}}print(){me(this.doc())||this.toast.toast(`Allow pop-ups to print`)}static ɵfac=function(e){return new(e||a$2)};static ɵcmp=Il({type:a$2,selectors:[[`app-reviewer`]],viewQuery:function(e,i){if(e&1&&Zg(tt,5),e&2){let n;Dw(n=Ew())&&(i.content=n.first)}},decls:2,vars:2,consts:[[`content`,``],[3,`fullscreen`],[1,`back-header`],[`data-tooltip`,`Back`,1,`icon-btn`,3,`click`,`innerHTML`],[2,`flex`,`1`,`min-width`,`0`],[2,`font-size`,`14px`,`font-weight`,`600`,`line-height`,`1.3`,`display`,`-webkit-box`,`-webkit-line-clamp`,`2`,`-webkit-box-orient`,`vertical`,`overflow`,`hidden`,`overflow-wrap`,`anywhere`],[2,`font-size`,`11.5px`,`color`,`var(--text-faint)`],[1,`font-controls`,2,`display`,`flex`,`gap`,`4px`],[`aria-label`,`Find in document`,`data-tooltip`,`Find in document`,1,`icon-btn`,3,`click`,`innerHTML`],[`data-tooltip`,`Smaller text`,1,`icon-btn`,`text-btn`,3,`click`],[`data-tooltip`,`Larger text`,1,`icon-btn`,`text-btn`,3,`click`],[1,`screen`,`rev-screen`],[1,`ai-mode-toggle`],[1,`faint`,2,`font-size`,`11.5px`,`margin`,`4px 2px 0`,`text-align`,`center`],[1,`ai-gen-bar`],[1,`ai-gen-bar`,`err`],[1,`find-bar`],[`type`,`search`,`placeholder`,`Find in document…`,`aria-label`,`Find in document`,`autocomplete`,`off`,1,`text-input`,3,`ngModelChange`,`input`,`keydown`,`ngModel`],[1,`faint`],[`id`,`review-content`,1,`reader`,`summary-mode`,3,`innerHTML`],[1,`reader-actions`],[1,`btn`,`btn-primary`,3,`click`],[3,`innerHTML`],[`data-tooltip`,`Download the exact Reviewer shown on screen as a PDF`,1,`btn`,`btn-primary`,2,`margin-top`,`10px`,`width`,`100%`,3,`click`,`disabled`],[2,`display`,`grid`,`grid-template-columns`,`1fr 1fr`,`gap`,`8px`,`width`,`100%`,`margin-top`,`10px`],[`data-tooltip`,`Download the study sheet as Markdown`,1,`btn`,`btn-secondary`,3,`click`],[`data-tooltip`,`Open a printable study sheet`,1,`btn`,`btn-secondary`,3,`click`],[`type`,`button`,3,`click`],[1,`ai-dot`],[`type`,`button`,1,`ai-retry`,3,`click`]],template:function(e,i){if(e&1&&(xs(0,`ion-content`,1),ew(1,rt,44,35),Ml()),e&2){let n;jg(`fullscreen`,!0),oI(),tw((n=i.doc())?1:-1,n)}},dependencies:[Ta,un,Ie,on,Ot,f],encapsulation:2})};export{Ye as ReviewerPage};