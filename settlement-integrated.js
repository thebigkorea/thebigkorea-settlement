const PAGES={
 manage:{url:"settlement-admin.html",title:"정산 현황·관리",desc:"월별·점포별 정산 내역과 최종정산액을 한눈에 확인합니다."},
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