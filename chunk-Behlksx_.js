import{d as v,f as w,h as z}from"./chunk-BTFgPefw.js";import{t}from"./chunk-gOF4uCpS.js";import"./chunk-BbOICyDP.js";import"./chunk-C20XqLb7.js";import"./chunk-C4YllZhX.js";import"./chunk-n11wUCnK.js";import"./chunk-foUULV0k.js";import"./chunk-CABSGZFi.js";import"./chunk-Bh3eoH14.js";import{At as g,En as zt,It as jg,L as Ml,O as Jg,Ot as fw,Pt as im,Qt as oI,St as dm,Tn as zg,Tt as ew,Vt as lm,W as Pg,Xt as nr,bn as xl,cn as sm,dt as Yw,et as Uf,f as Dw,ft as ZI,hn as vb,i as Aa,jt as hE,m as Ew,mt as Zg,n as $w,nn as pw,on as sS,ot as Ws,rn as qI,s as Bf,un as tw,x as Il,xn as xs,yt as cS}from"./chunk-voKL8BjL.js";import{c as el}from"./chunk-T2vN3j-C.js";import{_t as m$1,b as Ht,gt as f,ht as m$2,nt as pe,q as et$1,rt as qt,st as tt$1,xt as H}from"./main-IMR4ANT4.js";import{o as K,p as ie,s as M,u as X$1,y as z$1}from"./chunk-DXRPmtQD.js";import{t as B}from"./chunk-Bysnahfs.js";import"./chunk-D3rq6eU0.js";import{a as me,l as ue,n as de,s as pe$1}from"./chunk-C4bQJ7k_.js";import{t as a}from"./chunk-DxlhlKYy.js";import{a as p}from"./chunk-BG7XEChU.js";import{n as Ot,o as on,s as un,t as Ie}from"./chunk-m1hnM_B3.js";import{t as n}from"./chunk-DrU872KO.js";var Oe=14e3;var ze=5;var Qe=2e5;var qe=24e3;var Ye=15e4;var Ge=8;var Fe=`You are an expert exam reviewer writer. Read the DOCUMENT and produce a complete exam reviewer in strict JSON \u2014 the kind a top student would write by hand to cram from.

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
19. "acronyms" \u2014 every acronym or initialism the DOCUMENT uses (TCP, ATP, LAN, PAPA, HTML...): "acr" is the short form, "expansion" is what the letters stand for, "meaning" is one plain line about what it IS. Max 12, exam-relevant first. Also spell an acronym out inline the first time it appears in a definition or meaning, like "TCP (Transmission Control Protocol)". Empty array when the document has none.`;function m(a){return String(a||``).replace(/\s+/g,` `).trim()}function We(a){let n=[[1e3,`M`],[900,`CM`],[500,`D`],[400,`CD`],[100,`C`],[90,`XC`],[50,`L`],[40,`XL`],[10,`X`],[9,`IX`],[5,`V`],[4,`IV`],[1,`I`]],e=``;for(let[t,i]of n)for(;a>=t;)e+=i,a-=t;return e}function W(a,n){let e=a.indexOf(` — `);return e<1?n(a):`<b>${n(a.slice(0,e))}</b> \u2014 ${n(a.slice(e+3))}`}function J(a){if(!a||!Array.isArray(a.parts)||!a.parts.length)return null;let n=[],e=1;for(let s of a.parts){if(!s||!Array.isArray(s.sections)||!s.sections.length)continue;let x=[];for(let r of s.sections){let T=m(r.explanation),N=Array.isArray(r.bullets)?r.bullets.map(m).filter(Boolean):[],u=Array.isArray(r.steps)?r.steps.map(m).filter(Boolean):[],M=Array.isArray(r.terms)?r.terms.map(_=>({term:m(_?.term),meaning:m(_?.meaning).replace(/^meaning:\s*/i,``),bullets:Array.isArray(_?.bullets)?_.bullets.map(m).filter(Boolean):[],memory:m(_?.memory)||null})).filter(_=>_.term&&(_.meaning||_.bullets.length)):[];if(!T&&!N.length&&!u.length&&!M.length)continue;let d=r.table&&Array.isArray(r.table.headers)&&Array.isArray(r.table.rows)&&r.table.rows.length?{headers:r.table.headers.map(m).filter(Boolean),rows:r.table.rows.map(_=>Array.isArray(_)?_.map(m):[]).filter(_=>_.length)}:null,w=Number(r.stars);x.push({num:r.num!=null?Number(r.num):e,heading:m(r.heading)||`Section ${e}`,mustKnow:m(r.mustKnow)||null,stars:Number.isFinite(w)?Math.max(0,Math.min(3,Math.round(w))):null,definition:m(r.definition)||null,explanation:T,terms:M,bullets:N,steps:u,table:d,mnemonic:m(r.mnemonic)||null,important:m(r.important)||null,example:m(r.example)||null,memory:m(r.memory)||null,examClue:m(r.examClue)||null}),e++}if(x.length){let r=(m(s.title)||`PART`).replace(/^PART\s+[IVXLC\d]+\s*[—–-]?\s*/i,``)||`PART`;n.push({title:r,sections:x})}}if(!n.length)return null;let t=Array.isArray(a.highYield)?a.highYield.map(s=>({label:m(s?.label),items:Array.isArray(s?.items)?s.items.map(m).filter(Boolean):[]})).filter(s=>s.label&&s.items.length):[],i=Array.isArray(a.idQuestions)?a.idQuestions.map(s=>({clue:m(s?.clue),answer:m(s?.answer)})).filter(s=>s.clue&&s.answer):[],c=Array.isArray(a.myths)?a.myths.map(s=>({myth:m(s?.myth),fact:m(s?.fact)})).filter(s=>s.myth&&s.fact):[],o=Array.isArray(a.gaps)?a.gaps.map(m).filter(Boolean).slice(0,5):[],l=Array.isArray(a.finalReview)?a.finalReview.map(m).filter(Boolean):[],p=Array.isArray(a.acronyms)?a.acronyms.map(s=>({acr:m(s?.acr).toUpperCase().replace(/[^A-Z0-9]/g,``),expansion:m(s?.expansion),meaning:m(s?.meaning)})).filter(s=>s.acr.length>=2&&s.acr.length<=10&&s.expansion):[],h=new Set,g=p.filter(s=>h.has(s.acr)?!1:(h.add(s.acr),!0)).slice(0,12);return{v:ze,title:m(a.title)||`Exam Reviewer`,intro:m(a.intro)||``,acronyms:g,parts:n,idQuestions:i,myths:c,gaps:o,finalReview:l,highYield:t}}function Xe(a,n){if(a.length<=Oe)return[a];let e=[],t=a.split(/\n{2,}/),i=``;for(let c of t)(i+`

`+c).length>Oe&&i?(e.push(i),i=c):i=i?i+`

`+c:c;return i&&e.push(i),e.slice(0,n)}function Be(a){try{return JSON.parse(a)}catch{let n=String(a||``).match(/\{[\s\S]*\}/);if(n)try{return JSON.parse(n[0])}catch{}}return null}var F=class extends Error{};async function X(a,n,e,t){let i;try{i=await H(a,{json:!0,maxOutputTokens:n,temperature:.3,timeoutMs:e})}catch(o){let l=String(o?.message||o);if(l.includes(`no_keys_configured`)||l.includes(`origin_not_allowed`))throw new F(l);return/timeout|upstream_timeout|504|abort/i.test(l)&&(t.timeoutSeen=!0),null}let c=J(Be(i));if(c)return c;try{return J(Be(await H(`${a}

Return ONLY valid JSON \u2014 no prose before or after, and do not cut the JSON short.`,{json:!0,maxOutputTokens:n,temperature:.2,timeoutMs:e})))}catch(o){let l=String(o?.message||o);if(l.includes(`no_keys_configured`)||l.includes(`origin_not_allowed`))throw new F(l);return/timeout|upstream_timeout|504|abort/i.test(l)&&(t.timeoutSeen=!0),null}}function Je(a){if(!a.length)return null;return J(w(v({},a[0]),{parts:a.flatMap(e=>e.parts||[]).map(e=>({title:e.title,sections:(e.sections||[]).map(c=>{var o=c,{num:t}=o;return z(o,[`num`])})})),highYield:a.flatMap(e=>e.highYield||[]).slice(0,10),idQuestions:a.flatMap(e=>e.idQuestions||[]).slice(0,14),myths:a.flatMap(e=>e.myths||[]).slice(0,8),finalReview:a.flatMap(e=>e.finalReview||[]).slice(0,12),acronyms:a.flatMap(e=>e.acronyms||[]),gaps:a.flatMap(e=>e.gaps||[])}))}async function je(a,{force:n=!1}={}){let e=a.reviewerAI,t=Array.isArray(e)?e.length:e?.parts?.length;if(!n&&t&&e.v===ze)return{reviewer:e,cached:!0};let i=String(a.text||``).trim();if(i.length<300)return{error:`not_enough_content`};let c={timeoutSeen:!1},o=null;try{if(i.length<=Qe){let p=K(i);o=await X(`${Fe}${p?`

DECK OUTLINE (slide/page \u2192 its title):
${p}
Every outline entry must be covered by some section.
`:``}

DOCUMENT (complete):

${i}`,qe,Ye,c)}if(!o){let p=Xe(i,Ge);if(p.length===1)o=await X(`${Fe}

DOCUMENT:

${p[0]}`,8e3,95e3,c);else{let h=new Array(p.length).fill(null),g=0,s=Array.from({length:Math.min(3,p.length)},async()=>{for(;g<p.length;){let r=g++,T=`DOCUMENT (part ${r+1} of ${p.length}):

${p[r]}

Cover only the topics in this part.`;h[r]=await X(T,8e3,95e3,c)}});await Promise.all(s);let x=h.filter(Boolean);if(x.length){o=Je(x);let r=h.filter(T=>T===null).length;if(r){let T=Array.isArray(o.gaps)?o.gaps:[];T.unshift(`${r} of ${p.length} document parts could not be reviewed \u2014 regenerate for another try.`),o=w(v({},o),{gaps:T.slice(0,6)})}}}}}catch(p){if(p instanceof F)return{error:`relay_unavailable`};throw p}if(!o)return{error:c.timeoutSeen?`timeout`:`generation_failed`};let l=X$1(i);l&&(o=w(v({},o),{coverage:{slides:l,parts:o.parts.length}}));try{await Ht(a.id,{reviewerAI:o})}catch{}return{reviewer:o,cached:!1}}function Ue(a,n){let e=n,t=[];t.push(`
    <div class="rvw-head">
      <div class="rvw-eyebrow">\u2726 AI Exam Reviewer</div>
      <h1 class="rvw-title">${e(a.title)}</h1>
      ${a.intro?`<p class="rvw-overview">${e(a.intro)}</p>`:``}
    </div>`);let i=a.acronyms||[];i.length&&t.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">\u{1F511}</span><h3>Key Acronyms</h3></div>
        <p class="ai-hy-intro">What each abbreviation stands for:</p>
        ${i.map(s=>`
          <div class="ai-acr" data-para>
            <span class="ai-acr-badge">${e(s.acr)}</span>
            <span class="ai-acr-body"><b>${e(s.expansion)}</b>${s.meaning?` \u2014 ${e(s.meaning)}`:``}</span>
          </div>`).join(``)}
      </div>`);let c=0;for(let s of a.parts){c++;let x=(s.title||`PART`).replace(/^PART\s+[IVXLC\d]+\s*[—–-]?\s*/i,``)||`PART`;t.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">${We(c)}</span><h3>${e(x)}</h3></div>`);for(let r of s.sections){t.push(`<div class="ai-sec">`);let T=r.mustKnow?`<span class="ai-flag ${/VERY/i.test(r.mustKnow)?`hot`:/Important/i.test(r.mustKnow)?`warm`:`cool`}">${e(r.mustKnow)}</span>`:``,N=r.stars?`<span class="ai-stars">`+`⭐`.repeat(Math.min(3,r.stars))+`</span>`:``;if(t.push(`<div class="ai-sec-head"><span class="ai-num">${e(r.num)}</span><h4>${e(r.heading)}${N}</h4>${T}</div>`),r.definition){let d=r.definition.indexOf(`=`);t.push(d>0?`<p class="ai-def"><span class="ai-def-term">${e(r.definition.slice(0,d).trim())}</span> = ${e(r.definition.slice(d+1).trim())}</p>`:`<p class="ai-def">${e(r.definition)}</p>`)}r.explanation&&t.push(`<p class="ai-expl" data-para>${e(r.explanation)}</p>`);for(let d of r.terms||[]){if(t.push(`<div class="ai-term" data-para>`),t.push(`<div class="ai-term-name">${e(d.term)}</div>`),d.meaning){let w=d.meaning.replace(/^meaning:\s*/i,``);t.push(`<p class="ai-term-meaning"><span class="ai-term-label">Meaning:</span> ${e(w)}</p>`)}d.bullets&&d.bullets.length&&t.push(`<ul class="ai-bullets">${d.bullets.map(w=>`<li data-para>${W(w,e)}</li>`).join(``)}</ul>`),d.memory&&t.push(`<div class="ai-box ai-memory"><span class="ai-box-label">Memory</span><span>${e(d.memory)}</span></div>`),t.push(`</div>`)}let u=r.bullets||[],M=r.steps||[];u.length&&t.push(`<ul class="ai-bullets">${u.map(d=>`<li data-para>${W(d,e)}</li>`).join(``)}</ul>`),M.length&&t.push(`<ol class="ai-steps">${M.map(d=>`<li data-para>${W(d,e)}</li>`).join(``)}</ol>`),r.table&&t.push(`<table class="ai-table"><thead><tr>${r.table.headers.map(d=>`<th>${e(d)}</th>`).join(``)}</tr></thead><tbody>${r.table.rows.map(d=>`<tr>${d.map(w=>`<td>${e(w)}</td>`).join(``)}</tr>`).join(``)}</tbody></table>`),r.mnemonic&&t.push(`<div class="ai-mnemonic" data-para><span class="ai-mnemonic-label">\u{1F9E0} Memorize</span><span>${e(r.mnemonic)}</span></div>`),r.important&&t.push(`<div class="ai-box ai-important" data-para><span class="ai-box-label">Important</span><span>${e(r.important)}</span></div>`),r.example&&t.push(`<div class="ai-box ai-example" data-para><span class="ai-box-label">Example</span><span>${e(r.example)}</span></div>`),r.memory&&t.push(`<div class="ai-box ai-memory" data-para><span class="ai-box-label">Memory trick</span><span>${e(r.memory)}</span></div>`),r.examClue&&t.push(`<div class="ai-box ai-clue" data-para><span class="ai-box-label">Exam clue</span><span>${e(r.examClue)}</span></div>`),t.push(`</div>`)}t.push(`</div>`)}let o=a.highYield||[];o.length&&t.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">\u{1F525}</span><h3>Super Important Exam Points</h3></div>
        <p class="ai-hy-intro">If you're short on study time, memorize these first:</p>
        ${o.map(s=>`
          <div class="ai-hy">
            <div class="ai-hy-label">${e(s.label)}</div>
            <ul class="ai-bullets">${s.items.map(x=>`<li data-para>${e(x)}</li>`).join(``)}</ul>
          </div>`).join(``)}
      </div>`);let l=a.idQuestions||[];l.length&&t.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">\u{1F4DD}</span><h3>Possible Identification Questions</h3></div>
        ${l.map(s=>`
          <div class="ai-idq" data-para>
            <div class="ai-idq-clue">${e(s.clue)}</div>
            <div class="ai-idq-ans">\u2192 ${e(s.answer)}</div>
          </div>`).join(``)}
      </div>`);let p=a.myths||[];p.length&&t.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">\u2696\uFE0F</span><h3>Myths vs Facts</h3></div>
        ${p.map(s=>`
          <div class="ai-myth" data-para>
            <div class="ai-myth-row bad">\u274C <span>${e(s.myth)}</span></div>
            <div class="ai-myth-row good">\u2705 <span>${e(s.fact)}</span></div>
          </div>`).join(``)}
      </div>`);let h=a.finalReview||[];h.length&&t.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">\u{1F3AF}</span><h3>One-Minute Final Review</h3></div>
        <p class="ai-hy-intro">Before your exam, remember:</p>
        ${h.map(s=>{let x=s.indexOf(`=`);return x>0?`<p class="ai-def" data-para><span class="ai-def-term">${e(s.slice(0,x).trim())}</span> = ${e(s.slice(x+1).trim())}</p>`:`<p class="ai-def" data-para>${e(s)}</p>`}).join(``)}
      </div>`);let g=a.gaps||[];return g.length&&t.push(`
      <div class="ai-gaps" data-para>
        <div class="ai-gaps-head">\u26A0\uFE0F Possibly missing from this reviewer</div>
        <ul>${g.map(s=>`<li>${e(s)}</li>`).join(``)}</ul>
      </div>`),t.push(`<p class="sum-note">AI-generated from your document — always double-check against your original source before the exam.</p>`),t.join(``)}var Ze=[`content`];function et(a,n){if(a&1){let e=fw();xs(0,`div`,12)(1,`button`,27),zg(`click`,function(){Bf(e);return Uf(pw(2).setAiMode(!0))}),Ws(2,`span`,22),sS(3,`ico`),$w(4,` AI reviewer`),Ml(),xs(5,`button`,27),zg(`click`,function(){Bf(e);return Uf(pw(2).setAiMode(!1))}),$w(6,`Pointers to review`),Ml()()}if(a&2){let e=pw(2);oI(),Jg(`on`,e.aiMode()),oI(),jg(`innerHTML`,cS(3,5,`sparkles`),hE),oI(3),Jg(`on`,!e.aiMode())}}function tt(a,n){a&1&&(xs(0,`p`,13),$w(1),Ml()),a&2&&(oI(),xl(`✓ `,n))}function it(a,n){a&1&&(xs(0,`div`,14),Ws(1,`span`,28),$w(2,` Forging your AI reviewer from this file… usually under a minute. Pointers to review shown meanwhile.`),Ml())}function nt(a,n){if(a&1){let e=fw();xs(0,`div`,15),$w(1,`AI reviewer couldn't be generated`),xs(2,`button`,29),zg(`click`,function(){Bf(e);return Uf(pw(2).retryAi())}),$w(3,`Retry`),Ml(),xs(4,`button`,29),zg(`click`,function(){Bf(e);return Uf(pw(2).byok.open(`The AI relay is busy or out of requests. Add your own free AI key to generate the reviewer.`))}),$w(5,`Add a key`),Ml()()}}function at(a,n){if(a&1){let e=fw();xs(0,`header`,2)(1,`button`,3),sS(2,`ico`),zg(`click`,function(){Bf(e);return Uf(pw().back())}),Ml(),xs(3,`div`,4)(4,`div`,5),$w(5),Ml(),xs(6,`div`,6),$w(7),Ml()(),xs(8,`div`,7)(9,`button`,8),sS(10,`ico`),zg(`click`,function(){Bf(e);return Uf(pw().toggleFind())}),Ml(),xs(11,`button`,9),zg(`click`,function(){Bf(e);return Uf(pw().fontMinus())}),$w(12,`A−`),Ml(),xs(13,`button`,10),zg(`click`,function(){Bf(e);return Uf(pw().fontPlus())}),$w(14,`A+`),Ml()()(),xs(15,`div`,11),ew(16,et,7,7,`div`,12),ew(17,tt,2,1,`p`,13),ew(18,it,3,0,`div`,14),ew(19,nt,6,0,`div`,15),xs(20,`div`,16)(21,`input`,17),dm(`ngModelChange`,function(i){Bf(e);let c=pw();return Yw(c.findQuery,i)||(c.findQuery=i),Uf(i)}),zg(`input`,function(){Bf(e);return Uf(pw().runFind())})(`keydown`,function(i){Bf(e);return Uf(pw().onFindKey(i))}),Ml(),qI(),xs(22,`span`,18),$w(23),Ml()(),Ws(24,`article`,19,0),xs(26,`div`,20)(27,`button`,21),zg(`click`,function(){Bf(e);return Uf(pw().quizMe())}),Ws(28,`span`,22),sS(29,`ico`),$w(30,` Quiz me on this`),Ml(),xs(31,`button`,23),zg(`click`,function(){Bf(e);return Uf(pw().exportPdf())}),Ws(32,`span`,22),sS(33,`ico`),$w(34),Ml(),xs(35,`div`,24)(36,`button`,25),zg(`click`,function(){Bf(e);return Uf(pw().exportMd())}),Ws(37,`span`,22),sS(38,`ico`),$w(39,` Export .md`),Ml(),xs(40,`button`,26),zg(`click`,function(){Bf(e);return Uf(pw().print())}),Ws(41,`span`,22),sS(42,`ico`),$w(43,` Print sheet`),Ml()()()()}if(a&2){let e,t=n,i=pw();oI(),jg(`innerHTML`,cS(2,23,`chevronLeft`),hE),oI(4),im(t.name),oI(2),sm(``,i.typeLabel(t.type),` · `,t.wordCount.toLocaleString(),` words`),oI(2),Jg(`on`,i.findVisible()),jg(`innerHTML`,cS(10,25,`search`),hE),oI(7),tw(i.aiState()===`ready`?16:-1),oI(),tw((e=i.coverage())?17:-1,e),oI(),tw(i.aiState()===`generating`?18:-1),oI(),tw(i.aiState()===`error`?19:-1),oI(),Jg(`hidden`,!i.findVisible()),oI(),lm(`ngModel`,i.findQuery),ZI(),oI(2),im(i.findCount()),oI(),jg(`innerHTML`,i.contentHtml(),hE),oI(4),jg(`innerHTML`,cS(29,27,`play`),hE),oI(3),jg(`disabled`,i.buildingPdf()||!i.reviewerReady()||i.aiMode()&&i.aiState()===`generating`),Pg(`aria-busy`,i.buildingPdf()),oI(),jg(`innerHTML`,cS(33,29,`download`),hE),oI(2),xl(` `,i.buildingPdf()?`Building PDF…`:i.aiMode()&&i.aiReviewer()?`Export AI Reviewer PDF`:`Export Pointers PDF`,` `),oI(3),jg(`innerHTML`,cS(38,31,`download`),hE),oI(4),jg(`innerHTML`,cS(42,33,`print`),hE)}}function Z(a,n=3){let e=[];for(let t=0;t<a.length;t+=n)e.push(a.slice(t,t+n));return e.map(t=>t.join(` `))}var st=/^(The|This|That|These|Those|It|Its|In|At|On|And|But|For|With|When|After|Today|Just|Only|Most|Many|Both|Each|Such|Then|They|There)$/;var Ke=class a$1{route=g(zt);router=g(Aa);toast=g(m$1);ui=g(n);typeLabel=p;qs=g(a);byok=g(m$2);sanitizer=g(vb);content;doc=nr(null);contentHtml=nr(``);scale=1;aiReviewer=nr(null);aiState=nr(`idle`);aiMode=nr(!0);aiTried=!1;genBusy=!1;coverage=nr(``);findVisible=nr(!1);toggleFind(){let n=!this.findVisible();this.findVisible.set(n),n?setTimeout(()=>document.querySelector(`input[aria-label="Find in document"]`)?.focus(),60):(this.findQuery=``,this.clearFind())}findCount=nr(``);reviewerReady=nr(!1);buildingPdf=nr(!1);nlp=null;nlpBuilding=!1;findMatches=[];findPos=-1;get themeIcon(){return this.ui.theme()===`dark`?`sun`:`moon`}ico(n){return t(n)}esc(n){return String(n).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}async load(){let e=await qt(this.route.snapshot.paramMap.get(`id`)||``);if(!e){this.router.navigateByUrl(`/tabs/library`);return}this.reviewerReady.set(!1),this.doc.set(e),e.reviewerAI?.parts?.length&&(this.aiReviewer.set(e.reviewerAI),this.aiState.set(`ready`),this.coverage.set(this.computeCoverage(e,e.reviewerAI)));let t=tt$1();this.scale=t.readerScale||1,this.aiMode.set(t.reviewerAiMode!==!1),setTimeout(()=>this.applyView(),0),this.tryGenerateAi()}ngAfterViewInit(){this.load()}buildNlp(){let n=this.doc(),e=z$1(String(n.text||``)),t=M(e),i=ie(e),c=i.topics,o=i.membership,l=B(e),p=[];if(c.length&&t.length){let u=new Map(c.map(d=>[d.title,[]])),M=[];for(let d of t){let w=o.get(d);w&&u.has(w)?u.get(w).push(d):M.push(d)}M.length>=2&&p.push({title:`Overview`,paras:Z(M)});for(let d of c){let w=u.get(d.title);w?.length&&p.push({title:d.title,paras:Z(w)})}}else p.push({title:null,paras:Z(t.length?t:e.split(new RegExp(`(?<=[.!?])\\s+`)))});let h=[],g=new Set;for(let u of l.sections)for(let M of u.terms){let d=M.toLowerCase();if(g.has(d)||h.length>=8)continue;g.add(d);let w=t.find(_=>_.toLowerCase().includes(d)&&_.length>20);w&&h.push({term:M,def:w})}let s=new Set([`energy`,`cells`,`cell`,`chemical`,`process`,`system`,`systems`,`example`,`water`,`level`,`levels`,`other`,`within`,`which`,`their`,`these`,`those`,`about`,`would`,`could`,`where`,`every`,`without`,`through`,`this`,`that`,`with`,`from`]),x=new Set,r=[],T=(u,M)=>{if(r.length>=7||!u)return;let d=M.trim().toLowerCase().slice(0,60);d&&x.has(d)||(d&&x.add(d),r.push({prompt:u,hint:M}))};for(let u of l.sections)T(`Can you explain \u201C${u.title}\u201D in your own words?`,u.points[0]||``),r.length<7&&T(`Can you list the key ideas of \u201C${u.title}\u201D without looking?`,u.points[1]||u.points[0]||``);let N=h.filter(u=>u.term.length>=5&&!s.has(u.term.toLowerCase()));for(let u of N)T(`Can you define \u201C${u.term}\u201D without looking?`,u.def);this.nlp={sents:t,topics:c,summary:l,sections:p,keyTermDefs:h,recallPrompts:r,readTargets:{summary:l.sections.flatMap(u=>u.points),full:p.flatMap(u=>u.paras)}}}summaryHtml(){let n=this.doc(),{summary:e,sections:t,keyTermDefs:i,recallPrompts:c}=this.nlp;if(!e.tldr.length)return`<div class="empty-state"><h3>Not enough to summarize</h3><p>This document has too little readable text. Try the Full text tab.</p></div>`;let o=[];return o.push(`
      <div class="rvw-head">
        <div class="rvw-eyebrow">${this.ico(`listChecks`)} Pointers to Review</div>
        <h1 class="rvw-title">${this.esc(n.name)}</h1>
        <div class="rvw-meta">${p(n.type)} \xB7 ${n.wordCount.toLocaleString()} words \xB7 ${t.length} section${t.length===1?``:`s`} \xB7 ${i.length} key term${i.length===1?``:`s`}</div>
      </div>`),e.tldr.length&&o.push(`
        <div class="rvw-part">
          <div class="rvw-part-head"><span class="rvw-num">I</span><h3>Key pointers</h3></div>
          <ul class="sum-points">
            ${e.tldr.map(l=>`<li data-point>${this.esc(l)}</li>`).join(``)}
          </ul>
        </div>`),i.length&&o.push(`
        <div class="rvw-part">
          <div class="rvw-part-head"><span class="rvw-num">II</span><h3>Key terms to know</h3></div>
          <dl class="rvw-terms">
            ${i.map(l=>`<div class="rvw-term"><dt>${this.esc(l.term)}</dt><dd>${this.esc(l.def)}</dd></div>`).join(``)}
          </dl>
        </div>`),e.sections.length&&o.push(`
        <div class="rvw-part">
          <div class="rvw-part-head"><span class="rvw-num">III</span><h3>Pointers by section</h3></div>
          ${e.sections.map((l,p)=>`
            <div class="sum-section">
              <div class="sum-head">
                <span class="sum-num">${String(p+1).padStart(2,`0`)}</span>
                <h4>${this.esc(l.title)}</h4>
                <span class="chip-count">${l.sentenceCount} sentence${l.sentenceCount===1?``:`s`}</span>
              </div>
              <ul class="sum-points">
                ${l.points.map(h=>`<li>${this.esc(h)}</li>`).join(``)}
              </ul>
            </div>`).join(``)}
        </div>`),c.length&&o.push(`
        <div class="rvw-part">
          <div class="rvw-part-head"><span class="rvw-num">IV</span><h3>Check your recall</h3></div>
          <ul class="rvq-list">
            ${c.map(l=>`
              <li class="rvq">
                <div class="rvq-q">${this.esc(l.prompt)}</div>
                ${l.hint?`<details class="rvq-reveal"><summary>Show hint</summary><span>${this.esc(l.hint)}</span></details>`:``}
              </li>`).join(``)}
          </ul>
        </div>`),o.join(``)+`<p class="sum-note">Pointers forged from your document — open <strong>Full text</strong> to read everything.</p>`}fullHtml(){return this.nlp.sections.map(n=>`
      <section class="reader-section">
        ${n.title?`<h2>${this.esc(n.title)}</h2>`:``}
        ${n.paras.map(e=>`<p data-para>${this.esc(e)}</p>`).join(``)}
      </section>`).join(``)+`<p class="reader-end">· · ·</p>`}trust(n){return this.sanitizer.bypassSecurityTrustHtml(n)}aiReviewHtml(){return Ue(this.aiReviewer(),n=>this.esc(n))}async tryGenerateAi(n=!1){if(this.aiTried||this.aiState()===`ready`&&!n||this.genBusy)return;this.aiTried=!0;let e=this.doc();if(!e?.text||String(e.text).trim().length<300)return;this.genBusy=!0,this.aiState.set(`generating`);let t=await je(e,{force:n});if(this.genBusy=!1,t.reviewer)this.aiReviewer.set(t.reviewer),this.aiState.set(`ready`),this.coverage.set(this.computeCoverage(e,t.reviewer)),this.byok.notifyAiOk();else if(t.error!==`not_enough_content`)this.aiState.set(`error`),this.byok.notifyAiFailure(t.error||`error`);else{this.aiState.set(`idle`);return}this.applyView()}retryAi(){this.genBusy||(this.aiTried=!1,this.aiState.set(`idle`),this.tryGenerateAi(!0))}computeCoverage(n,e){try{let t=X$1(n?.text),i=e?.parts?.length||0;if(t)return`Covers slides ${t} \xB7 ${i} part${i===1?``:`s`}`;if(i)return`${i} part${i===1?``:`s`} covering the full document`}catch{}return``}setAiMode(n){this.aiMode.set(n),et$1({reviewerAiMode:n}),this.applyView()}applyView(){let n=this.content?.nativeElement;if(!n)return;setTimeout(()=>this.applyScale(),0);let e=n.closest(`.rev-screen`)?.querySelector(`.font-controls`);if(!this.nlp){this.contentHtml.set(this.trust(`<div class="reader-loading">Preparing your document…</div>`)),this.nlpBuilding||(this.nlpBuilding=!0,setTimeout(()=>{this.buildNlp(),this.nlpBuilding=!1,this.applyView()},0));return}this.contentHtml.set(this.trust(this.aiMode()&&this.aiReviewer()?this.aiReviewHtml():this.summaryHtml())),this.reviewerReady.set(!0),n.classList.add(`summary-mode`),e&&(e.style.visibility=`hidden`),this.clearFind()}findQuery=``;clearFind(){this.findMatches=[],this.findPos=-1,this.findCount.set(``),this.content?.nativeElement?.querySelectorAll(`mark.find-hit, mark.find-current`).forEach(e=>{let t=e.parentNode;t.replaceChild(document.createTextNode(e.textContent||``),e),t.normalize()})}runFind(){this.clearFind();let n=this.findQuery.trim();if(n.length<2)return;let e=this.content.nativeElement,t=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),i=[];for(;t.nextNode();){let c=t.currentNode;c.nodeValue&&c.nodeValue.toLowerCase().includes(n.toLowerCase())&&i.push(c)}for(let c of i){let o=c.nodeValue||``,l=document.createDocumentFragment(),p=0,h=o.toLowerCase(),g=h.indexOf(n.toLowerCase());for(;g!==-1;){l.appendChild(document.createTextNode(o.slice(p,g)));let s=document.createElement(`mark`);s.className=`find-hit`,s.textContent=o.slice(g,g+n.length),l.appendChild(s),this.findMatches.push(s),p=g+n.length,g=h.indexOf(n.toLowerCase(),p)}l.appendChild(document.createTextNode(o.slice(p))),c.parentNode.replaceChild(l,c)}this.stepFind(0)}onFindKey(n){n.key===`Enter`&&(n.preventDefault(),this.stepFind(n.shiftKey?-1:1)),n.key===`Escape`&&(this.findQuery=``,this.clearFind())}stepFind(n){if(!this.findMatches.length){this.findCount.set(`0/0`);return}this.findPos=n===0?0:(this.findPos+n+this.findMatches.length)%this.findMatches.length,this.findMatches.forEach((e,t)=>e.classList.toggle(`find-current`,t===this.findPos)),this.findCount.set(`${this.findPos+1}/${this.findMatches.length}`),this.findMatches[this.findPos]?.scrollIntoView({block:`center`,behavior:`smooth`})}attachSaveOnPress(){let n=this.content?.nativeElement;n&&n.querySelectorAll(`[data-para]`).forEach(e=>{let t=e,i=null,c=null,o=p=>{p.pointerType===`mouse`&&p.button!==0||(c=null,i=setTimeout(async()=>{c=t;try{let h=(t.textContent||``).trim().slice(0,300),g=this.nlp.keyTermDefs.find(s=>h.toLowerCase().includes(s.term.toLowerCase()))?.term||this.firstKeyPhrase(h);await pe({docId:this.doc().id,sentence:h,term:g,type:`note`}),t.classList.add(`saved-flash`),setTimeout(()=>t.classList.remove(`saved-flash`),900),this.toast.toast(`Saved to your review deck ✦`)}catch{this.toast.toast(`Could not save this line`,!0)}},550))},l=()=>{c===null&&clearTimeout(i)};t.addEventListener(`pointerdown`,o),t.addEventListener(`pointerup`,l),t.addEventListener(`pointerleave`,l),t.addEventListener(`pointercancel`,l)})}firstKeyPhrase(n){let e=n.split(/\s+/).slice(0,6);for(let t=0;t<Math.min(3,e.length);t++){let i=e.slice(t).join(` `).match(/^([A-Z][a-zA-Z'’-]+(?:\s+(?:of|the|de|van|von|da)?[A-Z][a-zA-Z'’-]+)*)/);if(i&&i[1].length>3&&!st.test(i[1].split(` `)[0]))return i[1].split(` `).slice(0,3).join(` `)}return e.slice(0,4).join(` `)}applyScale(){let n=this.content?.nativeElement;n&&(n.style.zoom=String(this.scale),n.style.width=(100/this.scale).toFixed(4)+`%`)}fontMinus(){this.scale=Math.max(.85,+(this.scale-.1).toFixed(2)),et$1({readerScale:this.scale}),this.applyScale()}fontPlus(){this.scale=Math.min(1.5,+(this.scale+.1).toFixed(2)),et$1({readerScale:this.scale}),this.applyScale()}quizMe(){this.qs.currentDocId.set(this.doc().id),this.router.navigate([`/doc`,this.doc().id,`setup`])}back(){this.router.navigateByUrl(`/tabs/library`)}exportMd(){pe$1(this.doc()),this.toast.toast(`Downloaded pointers (.md)`)}async exportPdf(){let n=this.content?.nativeElement;if(!(this.buildingPdf()||!n||!this.reviewerReady())){this.buildingPdf.set(!0);try{this.aiMode()&&this.aiReviewer()?await ue(this.aiReviewer(),this.doc().name):await de(n,this.doc().name),this.toast.toast(`Reviewer PDF downloaded ✓`)}catch{this.toast.toast(`Could not build the PDF`,!0)}finally{this.buildingPdf.set(!1)}}}print(){me(this.doc())||this.toast.toast(`Allow pop-ups to print`)}static ɵfac=function(e){return new(e||a$1)};static ɵcmp=Il({type:a$1,selectors:[[`app-reviewer`]],viewQuery:function(e,t){if(e&1&&Zg(Ze,5),e&2){let i;Dw(i=Ew())&&(t.content=i.first)}},decls:2,vars:2,consts:[[`content`,``],[3,`fullscreen`],[1,`back-header`],[`data-tooltip`,`Back`,1,`icon-btn`,3,`click`,`innerHTML`],[2,`flex`,`1`,`min-width`,`0`],[2,`font-size`,`14px`,`font-weight`,`600`,`line-height`,`1.3`,`display`,`-webkit-box`,`-webkit-line-clamp`,`2`,`-webkit-box-orient`,`vertical`,`overflow`,`hidden`,`overflow-wrap`,`anywhere`],[2,`font-size`,`11.5px`,`color`,`var(--text-faint)`],[1,`font-controls`,2,`display`,`flex`,`gap`,`4px`],[`aria-label`,`Find in document`,`data-tooltip`,`Find in document`,1,`icon-btn`,3,`click`,`innerHTML`],[`data-tooltip`,`Smaller text`,1,`icon-btn`,`text-btn`,3,`click`],[`data-tooltip`,`Larger text`,1,`icon-btn`,`text-btn`,3,`click`],[1,`screen`,`rev-screen`],[1,`ai-mode-toggle`],[1,`faint`,2,`font-size`,`11.5px`,`margin`,`4px 2px 0`,`text-align`,`center`],[1,`ai-gen-bar`],[1,`ai-gen-bar`,`err`],[1,`find-bar`],[`type`,`search`,`placeholder`,`Find in document…`,`aria-label`,`Find in document`,`autocomplete`,`off`,1,`text-input`,3,`ngModelChange`,`input`,`keydown`,`ngModel`],[1,`faint`],[`id`,`review-content`,1,`reader`,`summary-mode`,3,`innerHTML`],[1,`reader-actions`],[1,`btn`,`btn-primary`,3,`click`],[3,`innerHTML`],[`data-tooltip`,`Download the exact Reviewer shown on screen as a PDF`,1,`btn`,`btn-primary`,2,`margin-top`,`10px`,`width`,`100%`,3,`click`,`disabled`],[2,`display`,`grid`,`grid-template-columns`,`1fr 1fr`,`gap`,`8px`,`width`,`100%`,`margin-top`,`10px`],[`data-tooltip`,`Download the pointers as Markdown`,1,`btn`,`btn-secondary`,3,`click`],[`data-tooltip`,`Open printable pointers to review`,1,`btn`,`btn-secondary`,3,`click`],[`type`,`button`,3,`click`],[1,`ai-dot`],[`type`,`button`,1,`ai-retry`,3,`click`]],template:function(e,t){if(e&1&&(xs(0,`ion-content`,1),ew(1,at,44,35),Ml()),e&2){let i;jg(`fullscreen`,!0),oI(),tw((i=t.doc())?1:-1,i)}},dependencies:[el,un,Ie,on,Ot,f],encapsulation:2})};export{Ke as ReviewerPage};