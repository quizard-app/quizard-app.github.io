import{t as e}from"./topics-CMOvnQe4.js";import{E as t,H as n,K as r,O as i,S as a,k as o,p as s,x as c,y as l}from"./index-BsD152C5.js";import{a as u,i as d}from"./gemini-Bv9es_do.js";import{i as f}from"./quiz-ai-DCdurtWb.js";import{t as p}from"./shareModal-CetwSGA_.js";var m=[`mcq`,`tf`,`fib`,`id`,`matching`,`ordering`,`short`,`except`,`multi`],h=!1;function g(){h=!1}async function _(g,_){h=!0;let x=await n(_.state.currentDocId);if(!x||!h){_.go(`library`);return}let S=_.getConfig(x.id),C=S.count,w={...S.mix},T=S.difficulty,E=S.shuffle,D=S.timerSec,O=S.fresh,k=S.ai!==!1,A=k&&S.aiAuthor===!0,j=!!S.focusWeak,M=S.deepVisual!==!1,N=Array.isArray(x.topics)&&x.topics.length?x.topics:e(x.text).topics,P=new Set(S.topics||[]),F=i(x,{...S,topics:[...P]});C>F&&(C=Math.max(1,F)),g.innerHTML=`
    <header class="back-header">
      <button class="icon-btn" id="back-btn" data-tooltip="Back to library">${a(`chevronLeft`)}</button>
      <h2>Quiz Setup</h2>
      <button class="icon-btn" id="theme-btn" data-tooltip="${_.state.theme===`dark`?`Switch to light mode`:`Switch to dark mode`}">${_.state.theme===`dark`?a(`sun`):a(`moon`)}</button>
    </header>
    <div class="screen has-actionbar setup-screen">
      <div class="setup-hero">
        <div class="doc-icon ${x.type}">${a(`fileText`)}</div>
        <div style="min-width:0">
          <div class="doc-name">${s(x.name)}</div>
          <div class="doc-meta">${c(x.type)} · ${x.wordCount.toLocaleString()} words</div>
        </div>
      </div>

      ${l(`Number of questions`)}
      <div class="card row" style="padding:13px 16px;border-top:none">
        <span class="label">Questions</span>
        <div class="stepper" data-tooltip="How many questions to generate (1–200)">
          <button id="count-minus" data-tooltip="Fewer questions">−</button>
          <span class="val" id="count-val">${C}</span>
          <button id="count-plus" data-tooltip="More questions">+</button>
        </div>
      </div>
      <p class="faint" id="pool-hint" style="font-size:12px;margin:8px 4px 0"></p>
      ${l(`Question types`)}
      <div class="type-grid">
        ${m.map(e=>`
          <button class="type-card ${w[e]?`on`:``}" data-type="${e}" data-tooltip="${b(e)}">
            <div class="t-head">${v(e)}${t[e].name}</div>
            <div class="t-sub">${y(e)}</div>
            <div class="t-count" data-count-for="${e}"></div>
          </button>`).join(``)}
      </div>

      ${N.length?`
      ${l(`Topics in this document`)}
      <div class="chip-row" id="topic-row">
        <button class="chip ${P.size===0?`on`:``}" data-topic-all data-tooltip="Include every topic in the quiz">All topics</button>
        ${N.map(e=>`
          <button class="chip ${P.has(e.title)?`on`:``}" data-topic="${s(e.title)}" data-tooltip="Focus questions on this topic only">
            ${s(e.title)} <span class="chip-count">${e.count}</span>
          </button>`).join(``)}
      </div>
      <p class="faint" id="topic-hint" style="font-size:12px;margin:8px 4px 0"></p>`:``}

      ${l(`Difficulty`)}
      <div class="seg" id="diff-seg" data-tooltip="Easier = common terms · Harder = rare terms">
        <button data-diff="easy" class="${T===`easy`?`on`:``}" data-tooltip="Common, frequently-appearing terms">Easy</button>
        <button data-diff="medium" class="${T===`medium`?`on`:``}" data-tooltip="Balanced mix of terms">Medium</button>
        <button data-diff="hard" class="${T===`hard`?`on`:``}" data-tooltip="Rare, specific technical terms">Hard</button>
        <button data-diff="adaptive" class="${T===`adaptive`?`on`:``}" data-tooltip="Rises to rarer terms on a streak, eases off after a miss">Adaptive</button>
      </div>

      ${l(`Options`)}
      <div class="card" style="padding:2px 16px;border-top:1px solid var(--border)">
        <div class="row" data-tooltip="Google Gemini writes complete exam-style questions from the parsed content">
          <div><div class="label">AI-written questions</div><div class="sub">${u()?`Gemini · built-in relay`:d()?`Gemini · personal key`:`Gemini · needs the relay or a key (Settings)`}</div></div>
          <div class="switch ${k?`on`:``}" id="sw-ai" data-tooltip="Toggle AI question writing"></div>
        </div>
        <div class="row" id="author-row" ${k?``:`style="display:none"`} data-tooltip="Gemini authors the whole quiz from scratch — why and scenario questions, not just rephrased sentences">
          <div><div class="label">↳ Full AI authoring</div><div class="sub">AI writes every question from the whole document</div></div>
          <div class="switch ${A?`on`:``}" id="sw-author" data-tooltip="Toggle full AI authoring"></div>
        </div>
        <div class="row" data-tooltip="When on, the next attempt uses a new random order">
          <div><div class="label">Shuffle questions</div><div class="sub">Randomize order every attempt</div></div>
          <div class="switch ${E?`on`:``}" id="sw-shuffle" data-tooltip="Toggle shuffling"></div>
        </div>
        <div class="row">
          <div><div class="label">Timer</div><div class="sub">Seconds per question</div></div>
          <div class="seg" id="timer-seg" style="grid-auto-columns:auto;width:auto" data-tooltip="Add time pressure per question">
            ${[0,15,30].map(e=>`<button data-sec="${e}" style="padding:8px 14px" class="${D===e?`on`:``}">${e===0?`Off`:e+`s`}</button>`).join(``)}
          </div>
        </div>
        <div class="row" style="border-bottom:none" data-tooltip="On = brand-new questions each time; Off = identical quiz">
          <div><div class="label">Fresh questions each attempt</div><div class="sub">Regenerate from the document instead of repeating</div></div>
          <div class="switch ${O?`on`:``}" id="sw-fresh" data-tooltip="Toggle fresh generation"></div>
        </div>
        <div class="row" style="border-bottom:none" data-tooltip="Weight questions toward terms you've gotten wrong before, across all your quizzes">
          <div><div class="label">Focus my weak spots</div><div class="sub">Bias generation toward your past mistakes</div></div>
          <div class="switch ${j?`on`:``}" id="sw-weak" data-tooltip="Toggle weakness-aware generation"></div>
        </div>
        <div class="row" style="border-bottom:none" data-tooltip="Gemini analyzes page images, diagrams, code & charts; GLM writes the questions so you're quizzed on the visuals too">
          <div><div class="label">Deep visual analysis</div><div class="sub">Questions from diagrams, code & charts</div></div>
          <div class="switch ${M?`on`:``}" id="sw-visual" data-tooltip="Toggle visual analysis"></div>
        </div>
      </div>

      <div class="setup-actionbar">
        <button class="btn btn-primary" id="start-btn" style="font-size:15px;padding:15px">
          ${a(`play`)} Start Quiz
        </button>
        <button class="btn btn-secondary" id="share-btn" style="margin-top:10px;width:100%" data-tooltip="Generate this quiz and get a link to send — no app or key needed to play">
          ${a(`share`)} Share quiz link
        </button>
        <p class="center faint" id="gen-note" style="font-size:12px;margin-top:10px"></p>
      </div>
    </div>
  `;let I=g.querySelector(`#pool-hint`),L=g.querySelector(`#gen-note`),R=g.querySelector(`#topic-hint`);function z(){g.querySelectorAll(`#topic-row [data-topic]`).forEach(e=>{e.classList.toggle(`on`,P.has(e.dataset.topic))}),g.querySelector(`[data-topic-all]`)?.classList.toggle(`on`,P.size===0),R&&(R.textContent=P.size?`Focusing on ${P.size} topic${P.size===1?``:`s`} — other topics are excluded`:`Questions will cover the whole document`)}g.querySelectorAll(`#topic-row [data-topic]`).forEach(e=>e.addEventListener(`click`,()=>{let t=e.dataset.topic;P.has(t)?P.delete(t):P.add(t),z(),B(),V()})),g.querySelector(`[data-topic-all]`)?.addEventListener(`click`,()=>{P.clear(),z(),B(),V()}),z();function B(){F=i(x,{count:999,mix:{...w},difficulty:T,topics:[...P]}),C>F&&(C=Math.max(1,F)),g.querySelector(`#count-val`).textContent=C,I&&(I.textContent=F<5?`This document supports about ${F} question${F===1?``:`s`} with current settings`:`Up to ~${F} questions available from this document`)}function V(){let e=m.filter(e=>w[e]),t=e.length?C:0;for(let n of m){let r=g.querySelector(`[data-count-for="${n}"]`);r.textContent=w[n]?`~${Math.max(1,Math.round(t/e.length))} questions`:`Off`}L.textContent=e.length?``:`Select at least one question type`,g.querySelector(`#start-btn`).disabled=!e.length}V(),B();function H(e){C=Math.min(F||200,Math.min(200,Math.max(1,e))),g.querySelector(`#count-val`).textContent=C,V()}g.querySelector(`#count-minus`).addEventListener(`click`,()=>H(C-(C>10?5:1))),g.querySelector(`#count-plus`).addEventListener(`click`,()=>H(C+(C>=10?5:1))),g.querySelectorAll(`.type-card`).forEach(e=>e.addEventListener(`click`,()=>{let t=e.dataset.type,n=Object.values(w).filter(Boolean).length;w[t]&&n===1||(w[t]=!w[t],e.classList.toggle(`on`,w[t]),V())})),g.querySelectorAll(`#diff-seg button`).forEach(e=>e.addEventListener(`click`,()=>{T=e.dataset.diff,g.querySelectorAll(`#diff-seg button`).forEach(t=>t.classList.toggle(`on`,t===e)),B(),V()})),g.querySelectorAll(`#timer-seg button`).forEach(e=>e.addEventListener(`click`,()=>{D=parseInt(e.dataset.sec,10),g.querySelectorAll(`#timer-seg button`).forEach(t=>t.classList.toggle(`on`,t===e))})),g.querySelector(`#sw-ai`).addEventListener(`click`,e=>{k=!k,e.currentTarget.classList.toggle(`on`,k),k||(A=!1,g.querySelector(`#sw-author`)?.classList.remove(`on`)),g.querySelector(`#author-row`).style.display=k?``:`none`}),g.querySelector(`#sw-author`).addEventListener(`click`,e=>{A=k&&!A,e.currentTarget.classList.toggle(`on`,A)}),g.querySelector(`#sw-shuffle`).addEventListener(`click`,e=>{E=!E,e.currentTarget.classList.toggle(`on`,E)}),g.querySelector(`#sw-fresh`).addEventListener(`click`,e=>{O=!O,e.currentTarget.classList.toggle(`on`,O)}),g.querySelector(`#sw-weak`).addEventListener(`click`,e=>{j=!j,e.currentTarget.classList.toggle(`on`,j)}),g.querySelector(`#sw-visual`).addEventListener(`click`,e=>{M=!M,e.currentTarget.classList.toggle(`on`,M)}),g.querySelector(`#back-btn`).addEventListener(`click`,()=>_.go(`library`)),g.querySelector(`#theme-btn`).addEventListener(`click`,()=>_.toggleTheme()),g.querySelector(`#start-btn`).addEventListener(`click`,async()=>{let e={count:C,mix:{...w},difficulty:T,shuffle:E,timerSec:D,fresh:O,topics:[...P],ai:k,aiAuthor:k&&A,focusWeak:j,deepVisual:M,fixedSeed:null};if(j)try{e.weakTerms=await r(x.id)}catch{e.weakTerms=[]}h&&(_.saveConfig(x.id,e),_.go(`quiz`))}),g.querySelector(`#share-btn`).addEventListener(`click`,async()=>{let e=g.querySelector(`#share-btn`),t=e.innerHTML;e.disabled=!0,e.textContent=`Generating…`;try{let e={count:C,mix:{...w},difficulty:T,shuffle:E,timerSec:D,fresh:O,topics:[...P],ai:k,aiAuthor:k&&A,focusWeak:j,deepVisual:M};if(j)try{e.weakTerms=await r(x.id)}catch{e.weakTerms=[]}let t=null;if(e.ai&&d()&&(t=await f(x,e,()=>{})),(!t||t.error===`not_enough_content`||!t.questions||!t.questions.length)&&(t=o(x,e)),!t||!t.questions||!t.questions.length){_.toast(`Not enough content to build a shareable quiz`,!0);return}p(_,{title:x.name,questions:t.questions,timerSec:e.timerSec,mode:`quiz`})}catch{_.toast(`Could not create a share link`,!0)}finally{e.disabled=!1,e.innerHTML=t}})}function v(e){return{mcq:a(`listChecks`),tf:a(`check`),fib:a(`fileText`),id:a(`target`),matching:a(`gitCompare`),ordering:a(`listOrdered`),short:a(`edit`),except:a(`x`),multi:a(`plus`)}[e]}function y(e){return{mcq:`Pick from 4 choices`,tf:`Judge the statement`,fib:`Complete the sentence`,id:`Name the missing term`,matching:`Match terms to definitions`,ordering:`Put steps in order`,short:`Write a short answer`,except:`Spot the one false statement`,multi:`Pick the two correct statements`}[e]}function b(e){return{mcq:`Choose the correct answer from 4 options`,tf:`Decide if the statement is true or false`,fib:`Fill the blank — complete the sentence`,id:`Type the term that matches the description`,matching:`Pair each term with the sentence that defines it`,ordering:`Arrange the shuffled steps into the correct sequence`,short:`Type a short phrase — graded automatically`,except:`Exam style: three statements are true, one is not`,multi:`Exam style: two statements are correct — select both`}[e]}export{_ as render,g as unmount};