const PAGES={
 manage:{url:"settlement-admin.html",title:"정산 현황·관리",desc:"월별·점포별 정산 내역과 지급상태를 한눈에 확인합니다."},
 input:{url:"settlement.html",title:"점포별 정산 입력",desc:"점포를 선택해 월정산을 입력하고 최종 지급액을 자동 계산합니다."},
 summary:{url:"settlement-summary.html",title:"월별 합산",desc:"월별 총매출·공제·원재료비·최종지급액을 합산 조회합니다."}
};
let current="manage";
const $=id=>document.getElementById(id);
window.addEventListener("DOMContentLoaded",()=>{
 const now=new Date();
 const prev=new Date(now.getFullYear(),now.getMonth()-1,1);
 $("baseMonth").value=`${prev.getFullYear()}-${String(prev.getMonth()+1).padStart(2,"0")}`;
 $("frame").addEventListener("load",()=>{restyleChild();syncMonth();$("loading").classList.add("hide")});
 $("baseMonth").addEventListener("change",syncMonth);
 openTab(sessionStorage.getItem("settlementTab")||"manage");
});
function openTab(tab){
 if(!PAGES[tab])tab="manage"; current=tab; sessionStorage.setItem("settlementTab",tab);
 document.querySelectorAll(".tabs button").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
 $("title").textContent=PAGES[tab].title;$("desc").textContent=PAGES[tab].desc;
 $("loading").classList.remove("hide"); $("frame").src=PAGES[tab].url;
}
function refreshCurrent(){ $("loading").classList.remove("hide"); $("frame").contentWindow.location.reload() }
function restyleChild(){
 try{
  const d=$("frame").contentDocument;if(!d)return;
  const s=d.createElement("style");
  s.textContent=`
   html,body{background:#fff!important;margin:0!important;padding:0!important}
   body{min-height:auto!important}
   .wrap{max-width:none!important;width:100%!important;margin:0!important;padding:14px 16px 30px!important}
   .header{display:none!important}
   .card{box-shadow:none!important;border:1px solid #dfe7e9!important;border-radius:14px!important;background:#fff!important}
   .filters{margin-top:0!important}
   button,.btn{border-radius:9px!important}
   table{background:#fff!important}
  `;
  d.head.appendChild(s);
  if(current==="manage"){
    // 지급상태/지급일/상태변경은 월정산 업무에서 사용하지 않음.
    // 원본 시트/데이터 컬럼은 안전을 위해 유지하고 화면에서만 제거.
    const textMap={"공제금액 합계":"총공제액","최종지급액":"최종정산액","정산건수":"정산건수"};
    d.querySelectorAll("*").forEach(el=>{
      if(el.children.length===0){
        const t=(el.textContent||"").trim();
        if(textMap[t]) el.textContent=textMap[t];
      }
    });

    // 테이블 헤더명 기준으로 지급상태/지급일 열 숨김
    const table=d.querySelector("table");
    if(table){
      const heads=[...table.querySelectorAll("thead th")];
      const hideIdx=[];
      heads.forEach((th,i)=>{
        const t=(th.textContent||"").trim();
        if(t.includes("지급상태")||t==="지급일") hideIdx.push(i);
        if(t==="최종지급액") th.textContent="최종정산액";
      });
      hideIdx.forEach(i=>{
        table.querySelectorAll("tr").forEach(tr=>{
          if(tr.children[i]) tr.children[i].style.display="none";
        });
      });
    }

    // 상단 필터 중 지급상태 select 숨김
    [...d.querySelectorAll("select")].forEach(sel=>{
      const opts=[...sel.options].map(o=>(o.textContent||"").trim());
      if(opts.some(t=>["미지급","지급완료","보류","진행중 정산"].includes(t))){
        sel.style.display="none";
      }
    });
  }
 }catch(e){console.warn(e)}
}
function syncMonth(){
 const m=$("baseMonth").value, f=$("frame");
 try{
  const d=f.contentDocument,w=f.contentWindow;if(!d)return;
  if(current==="manage"){
   const el=d.querySelector('input[type="month"]'); if(el){el.value=m;el.dispatchEvent(new Event("change",{bubbles:true}))}
   if(typeof w.applyFilter==="function")w.applyFilter();
  }else if(current==="input"){
   const el=d.getElementById("month");if(el)el.value=m;
  }else{
   const a=d.getElementById("startMonth"),b=d.getElementById("endMonth");
   if(a)a.value=m;if(b)b.value=m;
   if(typeof w.loadMonthlySummary==="function")w.loadMonthlySummary();
  }
 }catch(e){console.warn(e)}
}