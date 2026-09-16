const API_URL =
"https://script.google.com/macros/s/AKfycbwg42OHYPkw8nv1X9vbuRNntXdw5isaVfXEEBzz_ya2W9uhTDTDEh4H4EnyFf2UfScXnw/exec";

window.addEventListener("load", function(){
  setDefaultMonths();
  loadMonthlySummary();
});

function previousMonth(){
  const d=new Date();
  const p=new Date(d.getFullYear(),d.getMonth()-1,1);
  return p.getFullYear()+"-"+String(p.getMonth()+1).padStart(2,"0");
}

function setDefaultMonths(){
  const month=previousMonth();
  document.getElementById("startMonth").value=month;
  document.getElementById("endMonth").value=month;
}

async function loadMonthlySummary(){
  const startMonth=document.getElementById("startMonth").value;
  const endMonth=document.getElementById("endMonth").value;
  if(!startMonth || !endMonth){showMsg("조회월을 선택하세요.","warn");return;}

  try{
    const url=API_URL+"?action=getMonthlySummary"+
      "&startMonth="+encodeURIComponent(startMonth)+
      "&endMonth="+encodeURIComponent(endMonth)+
      "&t="+Date.now();
    const res=await fetch(url);
    const data=await res.json();
    if(!data.success){showMsg(data.message||"조회 실패","warn");return;}
    showMsg("","");
    renderSummary(data.rows||[]);
  }catch(e){
    showMsg("월별 합산자료를 불러오지 못했습니다.","warn");
  }
}

function renderSummary(rows){
  const tbody=document.getElementById("summaryBody");
  let t={sales:0,commission:0,hq:0,royalty:0,hqPurchase:0,mac:0,lotte:0,cj:0,etc:0,food:0,expense:0,deduction:0,payment:0};

  if(!rows.length){
    tbody.innerHTML='<tr><td colspan="14" class="empty">조회된 자료가 없습니다.</td></tr>';
    updateCards(t,0);
    return;
  }

  let html="";
  rows.forEach(function(row){
    t.sales+=Number(row.sales||0); t.commission+=Number(row.commissionAmount||0);
    t.hq+=Number(row.hqFeeAmount||0); t.royalty+=Number(row.royaltyAmount||0);
    t.hqPurchase+=Number(row.hqPurchaseCost||0); t.mac+=Number(row.macCost||0);
    t.lotte+=Number(row.lotteCost||0); t.cj+=Number(row.cjCost||0);
    t.etc+=Number(row.etcFoodCost||0); t.food+=Number(row.foodSubtotal||0);
    t.expense+=Number(row.expenseSubtotal||0); t.deduction+=Number(row.totalDeduction||0);
    t.payment+=Number(row.paymentAmount||0);

    html+=`<tr>
      <td>${safe(row.month)}</td><td>${money(row.sales)}</td><td>${money(row.commissionAmount)}</td>
      <td>${money(row.hqFeeAmount)}</td><td>${money(row.royaltyAmount)}</td>
      <td>${money(row.hqPurchaseCost)}</td><td>${money(row.macCost)}</td><td>${money(row.lotteCost)}</td>
      <td>${money(row.cjCost)}</td><td>${money(row.etcFoodCost)}</td><td>${money(row.foodSubtotal)}</td>
      <td>${money(row.expenseSubtotal)}</td><td>${money(row.totalDeduction)}</td><td>${money(row.paymentAmount)}</td>
    </tr>`;
  });

  html+=`<tr class="total-row"><td>합계</td><td>${money(t.sales)}</td><td>${money(t.commission)}</td>
    <td>${money(t.hq)}</td><td>${money(t.royalty)}</td><td>${money(t.hqPurchase)}</td>
    <td>${money(t.mac)}</td><td>${money(t.lotte)}</td><td>${money(t.cj)}</td><td>${money(t.etc)}</td>
    <td>${money(t.food)}</td><td>${money(t.expense)}</td><td>${money(t.deduction)}</td><td>${money(t.payment)}</td></tr>`;

  tbody.innerHTML=html;
  updateCards(t,rows.length);
}

function updateCards(t,count){
  document.getElementById("grandSales").textContent=money(t.sales);
  document.getElementById("grandDeduction").textContent=money(t.deduction);
  document.getElementById("grandPayment").textContent=money(t.payment);
  document.getElementById("grandCount").textContent=String(count);
}
function money(n){return Math.round(Number(n||0)).toLocaleString("ko-KR")}
function safe(v){return String(v||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function showMsg(text,type){
  const msg=document.getElementById("msg");
  msg.textContent=text||"";
  msg.className=text ? "msg "+type : "msg";
}
