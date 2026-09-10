import{t as e}from"./assets-CzjTyYhp.js";import"./index-CfNyFEBY.js";var t=null;function n(){t&&(clearTimeout(t),t=null)}var r=Array.from({length:10},(e,t)=>`<i style="--a:${t*36}deg;--d:${(.45+t*.045).toFixed(2)}s"></i>`).join(``),i=[{l:`16%`,t:`24%`,d:`0s`},{l:`82%`,t:`18%`,d:`.5s`},{l:`70%`,t:`64%`,d:`1s`},{l:`24%`,t:`70%`,d:`1.4s`},{l:`10%`,t:`48%`,d:`.8s`},{l:`88%`,t:`46%`,d:`1.8s`},{l:`40%`,t:`14%`,d:`1.1s`},{l:`58%`,t:`82%`,d:`.3s`}].map(e=>`<i style="left:${e.l};top:${e.t};animation-delay:${e.d}"></i>`).join(``);function a(n,a){n.innerHTML=`
    <div class="welcome" id="welcome">
      <div class="welcome-dust" aria-hidden="true">${i}</div>
      <div class="welcome-inner">
        <div class="welcome-mark">
          <span class="wm-halo"></span>
          <span class="wm-rune"></span>
          <span class="wm-rune r2"></span>
          <span class="wm-circle"></span>
          <span class="wm-icon"><img class="wiz-hero" src="${e(`wizard/wizard-welcome.jpg`)}" alt="Quizard wizard"></span>
          <span class="wm-sparks" aria-hidden="true">${r}</span>
        </div>
        <h1 class="welcome-title">
          <span class="wt-line">Welcome to</span>
          <span class="wt-name">Quizard</span>
        </h1>
        <p class="welcome-sub">Your documents, forged into quizzes.</p>
      </div>
      <div class="welcome-progress"><span></span></div>
    </div>
  `;let o=!1;function s(){o||(o=!0,n.querySelector(`#welcome`).classList.add(`exit`),setTimeout(()=>{a.go(a.state.afterIntro||(a.state.accountsExist?`accounts`:`onboarding`)),a.state.pendingResumeAsk&&(a.state.pendingResumeAsk=!1,a.state.resumeBanner&&(a.requestResume(),a.go(`quiz`)))},430))}let c=a.state.shortIntro;t=setTimeout(s,c?1100:2050),n.querySelector(`#welcome`).addEventListener(`click`,()=>{clearTimeout(t),s()})}export{a as render,n as unmount};