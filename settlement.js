const API_URL =
"https://script.google.com/macros/s/AKfycbwg42OHYPkw8nv1X9vbuRNntXdw5isaVfXEEBzz_ya2W9uhTDTDEh4H4EnyFf2UfScXnw/exec";

let STORE_LIST = [];

window.addEventListener("load", function(){
  setDefaultMonth();
  loadStores();
  calculate();
});

function setDefaultMonth(){
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  document.getElementById("month").value = yyyy + "-" + mm;
}

async function loadStores(){
  try{
    const res = await fetch(API_URL + "?action=getStores&t=" + Date.now());
    const data = await res.json();

    STORE_LIST = data.stores || [];

    const select = document.getElementById("storeSelect");
    select.innerHTML = `<option value="">점포를 선택하세요</option>`;

    STORE_LIST.forEach(function(store,index){
      const opt = document.createElement("option");
      opt.value = index;
      opt.textContent = store.storeName + " / " + store.market;
      select.appendChild(opt);
    });

  }catch(e){
    showMsg("점포정보를 불러오지 못했습니다.", "warn");
  }
}

function applyStoreInfo(){
  const idx = document.getElementById("storeSelect").value;
  if(idx === "") return;

  const store = STORE_LIST[Number(idx)];

  document.getElementById("brand").value = store.brand || "";
  document.getElementById("market").value = store.market || "";
  document.getElementById("region").value = store.region || "";

  document.getElementById("commissionRate").value = percentDisplay(store.commissionRate);
  document.getElementById("hqFeeRate").value = percentDisplay(store.hqFeeRate);
  document.getElementById("royaltyRate").value = percentDisplay(store.royaltyRate);

  calculate();
}

function calculate(){
  const sales = num("sales");

  const commissionAmount = sales * rate("commissionRate");
  const utilityCost = num("utilityCost");
  const departmentSubtotal = commissionAmount + utilityCost;

  const hqFeeAmount = roundup10(sales * rate("hqFeeRate"));
  const royaltyAmount = roundup10(sales * rate("royaltyRate"));
  const royaltySubtotal = hqFeeAmount + royaltyAmount;

  const foodSubtotal =
    num("hqPurchaseCost") +
    num("macCost") +
    num("lotteCost") +
    num("cjCost") +
    num("etcFoodCost");

  const expenseSubtotal =
    num("closingFee") +
    num("otherExpense") +
    num("insurancePremium") +
    num("laborCost") +
    num("socialInsurance") +
    num("cardFee") +
    num("otherDeduction");

  const totalDeduction =
    departmentSubtotal +
    royaltySubtotal +
    foodSubtotal +
    expenseSubtotal;

  const payment = sales - totalDeduction;

  setVal("commissionAmount", money(commissionAmount));
  setVal("departmentSubtotal", money(departmentSubtotal));
  setVal("hqFeeAmount", money(hqFeeAmount));
  setVal("royaltyAmount", money(royaltyAmount));
  setVal("royaltySubtotal", money(royaltySubtotal));
  setVal("foodSubtotal", money(foodSubtotal));
  setVal("expenseSubtotal", money(expenseSubtotal));

  document.getElementById("sumSales").textContent = money(sales);
  document.getElementById("sumDeduction").textContent = money(totalDeduction);
  document.getElementById("sumPayment").textContent = money(payment);
  document.getElementById("sumRemain").textContent = money(payment);
}

async function saveSettlement(){
  const storeIdx = document.getElementById("storeSelect").value;

  if(!val("month")){
    showMsg("정산월을 선택하세요.", "warn");
    return;
  }

  if(storeIdx === ""){
    showMsg("점포를 선택하세요.", "warn");
    return;
  }

  showMsg("정산자료와 첨부파일을 저장 중입니다.", "warn");

  const store = STORE_LIST[Number(storeIdx)];
  const attachments = await readAllAttachments();

  const payload = {
    action:"saveSettlement",
    month:val("month"),
    periodText:val("month"),
    brand:store.brand,
    storeName:store.storeName,
    market:store.market,
    region:store.region,
    sales:String(num("sales")),
    commissionRate:String(rate("commissionRate")),
    commissionAmount:String(numText("commissionAmount")),
    utilityCost:String(num("utilityCost")),
    departmentSubtotal:String(numText("departmentSubtotal")),
    hqFeeRate:String(rate("hqFeeRate")),
    hqFeeAmount:String(numText("hqFeeAmount")),
    royaltyRate:String(rate("royaltyRate")),
    royaltyAmount:String(numText("royaltyAmount")),
    royaltySubtotal:String(numText("royaltySubtotal")),
    hqPurchaseCost:String(num("hqPurchaseCost")),
    macCost:String(num("macCost")),
    lotteCost:String(num("lotteCost")),
    cjCost:String(num("cjCost")),
    etcFoodCost:String(num("etcFoodCost")),
    foodCost:String(numText("foodSubtotal")),
    foodSubtotal:String(numText("foodSubtotal")),
    closingFee:String(num("closingFee")),
    otherExpense:String(num("otherExpense")),
    insurancePremium:String(num("insurancePremium")),
    laborCost:String(num("laborCost")),
    socialInsurance:String(num("socialInsurance")),
    cardFee:String(num("cardFee")),
    otherDeduction:String(num("otherDeduction")),
    expenseSubtotal:String(numText("expenseSubtotal")),
    paymentStatus:val("paymentStatus"),
    paymentDate:val("paymentDate"),
    bankAccount:val("bankAccount"),
    memo:val("memo"),
    settlementFile:attachments.settlementFile
  };

  try{
    const res = await fetch(API_URL,{
      method:"POST",
      body:JSON.stringify(payload)
    });

    const data = await res.json();

    if(data.success){
      const printUrl =
  "https://thebigkorea.github.io/thebigkorea-settlement/settlement-print.html?id=" +
  encodeURIComponent(data.settlementId);

showMsg(
  "정산 저장 완료 / 최종지급액: " +
  money(data.paymentAmount),
  "ok"
);

document.getElementById("linkArea").innerHTML = `
  <button onclick="copySettlementLink('${printUrl}')">
    정산서 링크 복사
  </button>

  <a
    href="${printUrl}"
    target="_blank"
    class="link-btn"
  >
    정산서 열기
  </a>
`;
    }else{
      showMsg(data.message || "저장 실패", "warn");
    }

  }catch(e){
    showMsg("저장 중 오류가 발생했습니다.", "warn");
  }
}

async function readAllAttachments(){
  return {
    settlementFile: await readOneFile("settlementFile")
  };
}

function readOneFile(id){
  const input = document.getElementById(id);
  const file = input.files && input.files[0];

  if(!file) return Promise.resolve(null);

  return fileToObject(file);
}

async function readMultipleFiles(id){
  const input = document.getElementById(id);
  const files = Array.from(input.files || []);

  if(!files.length) return [];

  const list = [];

  for(const file of files){
    list.push(await fileToObject(file));
  }

  return list;
}

function fileToObject(file){
  return new Promise(function(resolve,reject){
    const reader = new FileReader();

    reader.onload = function(){
      const result = String(reader.result || "");
      const base64 = result.split(",")[1] || "";

      resolve({
        name:file.name,
        mimeType:file.type || "application/octet-stream",
        data:base64
      });
    };

    reader.onerror = function(){
      reject(reader.error);
    };

    reader.readAsDataURL(file);
  });
}

function val(id){
  return document.getElementById(id).value.trim();
}

function setVal(id,value){
  document.getElementById(id).value = value;
}

function normalizeNumberText(text){
  return String(text || "")
    .replace(/[０-９]/g,function(s){
      return String.fromCharCode(s.charCodeAt(0)-65248);
    })
    .replace(/,/g,"")
    .replace(/[^0-9.-]/g,"");
}

function num(id){
  return Number(normalizeNumberText(val(id))) || 0;
}

function numText(id){
  return num(id);
}

function rate(id){
  const v = Number(
    String(val(id))
      .replace(/[０-９]/g,function(s){
        return String.fromCharCode(s.charCodeAt(0)-65248);
      })
      .replace("%","")
      .replace(/,/g,"")
      .replace(/[^0-9.]/g,"")
  ) || 0;

  return v / 100;
}

function formatMoneyInput(input){
  const n = Number(normalizeNumberText(input.value)) || 0;
  input.value = n ? money(n) : "";
}

function formatRateInput(input){
  const n = Number(
    String(input.value)
      .replace(/[０-９]/g,function(s){
        return String.fromCharCode(s.charCodeAt(0)-65248);
      })
      .replace("%","")
      .replace(/[^0-9.]/g,"")
  ) || 0;

  input.value = n ? String(n) : "";
}

function percentDisplay(value){
  const n = Number(value || 0);
  if(!n) return "";
  return String(n * 100).replace(/\.0$/,"");
}

function money(n){
  return Math.round(Number(n || 0)).toLocaleString("ko-KR");
}

function roundup10(value){
  return Math.ceil(Number(value || 0) / 10) * 10;
}

function showMsg(text,type){
  const msg = document.getElementById("msg");
  msg.textContent = text;
  msg.className = "msg " + type;
}
function copySettlementLink(url){

  navigator.clipboard.writeText(url).then(function(){
    alert("정산서 링크가 복사되었습니다.");
  });

}
