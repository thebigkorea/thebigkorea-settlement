const PAGES={
 manage:{url:"settlement-admin.html",title:"정산 현황·관리",desc:"월별·점포별 정산 내역과 최종정산액을 한눈에 확인합니다."},
 input:{url:"settlement.html",title:"점포별 정산 입력",desc:"점포를 선택해 월정산을 입력하고 최종정산액을 자동 계산합니다."},
 summary:{url:"settlement-summary.html",title:"월별 합산",desc:"월별 총매출·총공제액·원재료비·최종정산액을 합산 조회합니다."}
};
let current="manage";
const $=id=>document.getElementById(id);

window.addEventListener("DOMContentLoaded",()=>{
 const now=new Date();
 const prev=new Date(now.getFullYear(),now.getMonth()-1,1);
 $("baseMonth").value=`${prev.getFullYear()}-${String(prev.getMonth()+1).padStart(2,"0")}`;

 $("frame").addEventListener("load",()=>{
   restyleChild();
   syncMonth();
   $("loading").classList.add("hide");
 });

 $("baseMonth").addEventListener("change",syncMonth);
 openTab(sessionStorage.getItem("settlementTab")||"manage");
});

function openTab(tab){
 if(!PAGES[tab])tab="manage";
 current=tab;
 sessionStorage.setItem("settlementTab",tab);
 document.querySelectorAll(".tabs button").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
 $("title").textContent=PAGES[tab].title;
 $("desc").textContent=PAGES[tab].desc;
 $("loading").classList.remove("hide");
 $("frame").src=PAGES[tab].url;
}

function refreshCurrent(){
 $("loading").classList.remove("hide");
 $("frame").contentWindow.location.reload();
}

function restyleChild(){
 try{
  const d=$("frame").contentDocument;
  if(!d)return;

  const s=d.createElement("style");
  s.id="integrated-child-style";

  let extra="";
  if(current==="input"){
    extra=`
      .wrap{padding:12px 14px 26px!important}
      .card{padding:15px 16px!important;margin-bottom:12px!important}
      .card h2{font-size:17px!important;margin-bottom:12px!important}
      .grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px 12px!important}
      .card:first-of-type .grid{grid-template-columns:150px 2fr 1fr 1fr 1fr!important}
      input,select,textarea{min-height:38px!important;padding:8px 10px!important}
      textarea{min-height:64px!important}
      .summary{gap:10px!important}
      .box{padding:13px 14px!important}
      @media(max-width:1100px){.card:first-of-type .grid{grid-template-columns:1fr 1fr 1fr!important}}
      @media(max-width:760px){.grid,.card:first-of-type .grid{grid-template-columns:1fr!important}}
    `;
  }else if(current==="summary"){
    extra=`
      .summary-cards{display:grid!important}
      .filter-card,.table-card{display:block!important}
      .table-card{margin-top:0!important}
      .msg:empty{display:none!important}
    `;
  }

  s.textContent=`
   html,body{background:#fff!important;margin:0!important;padding:0!important}
   body{min-height:auto!important}
   .wrap{max-width:none!important;width:100%!important;margin:0!important;padding:14px 16px 30px!important}
   .header{display:none!important}
   .card{box-shadow:none!important;border:1px solid #dfe7e9!important;border-radius:14px!important;background:#fff!important}
   .filters{margin-top:0!important}
   button,.btn{border-radius:9px!important}
   table{background:#fff!important}
   ${extra}
  `;

  const old=d.getElementById("integrated-child-style");
  if(old)old.remove();
  d.head.appendChild(s);

 }catch(e){console.warn("restyleChild:",e)}
}

function syncMonth(){
 const m=$("baseMonth").value;
 const f=$("frame");

 try{
  const d=f.contentDocument,w=f.contentWindow;
  if(!d)return;

  if(current==="manage"){
   const el=d.getElementById("monthFilter")||d.querySelector('input[type="month"]');
   if(el && el.value!==m){
     el.value=m;
     el.dispatchEvent(new Event("change",{bubbles:true}));
   }else if(typeof w.applyFilter==="function"){
     w.applyFilter();
   }

  }else if(current==="input"){
   const el=d.getElementById("month");
   if(el)el.value=m;

  }else if(current==="summary"){
   const a=d.getElementById("startMonth");
   const b=d.getElementById("endMonth");
   let changed=false;
   if(a && a.value!==m){a.value=m;changed=true;}
   if(b && b.value!==m){b.value=m;changed=true;}

   // iframe의 summary 페이지가 load 시 이미 1회 조회하므로
   // 기준월이 실제로 달라졌을 때만 추가 조회하여 중복 fetch/오류 표시를 방지
   if(changed && typeof w.loadMonthlySummary==="function"){
     w.loadMonthlySummary();
   }
  }
 }catch(e){console.warn("syncMonth:",e)}
}
