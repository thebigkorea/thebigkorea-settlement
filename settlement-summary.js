const API_URL =
"https://script.google.com/macros/s/AKfycbwg42OHYPkw8nv1X9vbuRNntXdw5isaVfXEEBzz_ya2W9uhTDTDEh4H4EnyFf2UfScXnw/exec";

window.addEventListener("load", function(){
  setDefaultMonths();
  loadMonthlySummary();
});

function setDefaultMonths(){

  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2,"0");
  const month = yyyy + "-" + mm;

  document.getElementById("startMonth").value = month;
  document.getElementById("endMonth").value = month;
}

async function loadMonthlySummary(){

  const startMonth =
    document.getElementById("startMonth").value;

  const endMonth =
    document.getElementById("endMonth").value;

  if(!startMonth || !endMonth){
    showMsg("조회월을 선택하세요.","warn");
    return;
  }

  try{

    const url =
      API_URL +
      "?action=getMonthlySummary" +
      "&startMonth=" + encodeURIComponent(startMonth) +
      "&endMonth=" + encodeURIComponent(endMonth) +
      "&t=" + Date.now();

    const res = await fetch(url);
    const data = await res.json();

    if(!data.success){
      showMsg(data.message || "조회 실패","warn");
      return;
    }

    renderSummary(data.rows || []);

  }catch(e){
    showMsg("월별 합산자료를 불러오지 못했습니다.","warn");
  }
}

function renderSummary(rows){

  const tbody =
    document.getElementById("summaryBody");

  if(!rows.length){
    tbody.innerHTML =
      `<tr><td colspan="9">조회된 자료가 없습니다.</td></tr>`;
    return;
  }

  let totalSales = 0;
  let totalCommission = 0;
  let totalHqFee = 0;
  let totalRoyalty = 0;
  let totalFood = 0;
  let totalExpense = 0;
  let totalDeduction = 0;
  let totalPayment = 0;

  let html = "";

  rows.forEach(function(row){

    totalSales += Number(row.sales || 0);
    totalCommission += Number(row.commissionAmount || 0);
    totalHqFee += Number(row.hqFeeAmount || 0);
    totalRoyalty += Number(row.royaltyAmount || 0);
    totalFood += Number(row.foodSubtotal || 0);
    totalExpense += Number(row.expenseSubtotal || 0);
    totalDeduction += Number(row.totalDeduction || 0);
    totalPayment += Number(row.paymentAmount || 0);

    html += `
      <tr>
        <td>${row.month}</td>
        <td>${money(row.sales)}</td>
        <td>${money(row.commissionAmount)}</td>
        <td>${money(row.hqFeeAmount)}</td>
        <td>${money(row.royaltyAmount)}</td>
        <td>${money(row.foodSubtotal)}</td>
        <td>${money(row.expenseSubtotal)}</td>
        <td>${money(row.totalDeduction)}</td>
        <td>${money(row.paymentAmount)}</td>
      </tr>
    `;
  });

  html += `
    <tr>
      <td>합계</td>
      <td>${money(totalSales)}</td>
      <td>${money(totalCommission)}</td>
      <td>${money(totalHqFee)}</td>
      <td>${money(totalRoyalty)}</td>
      <td>${money(totalFood)}</td>
      <td>${money(totalExpense)}</td>
      <td>${money(totalDeduction)}</td>
      <td>${money(totalPayment)}</td>
    </tr>
  `;

  tbody.innerHTML = html;
}

function money(n){
  return Math.round(Number(n || 0)).toLocaleString("ko-KR");
}

function showMsg(text,type){
  const msg = document.getElementById("msg");
  msg.textContent = text;
  msg.className = "msg " + type;
}