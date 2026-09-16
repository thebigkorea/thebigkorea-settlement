const API_URL =
"https://script.google.com/macros/s/AKfycbwg42OHYPkw8nv1X9vbuRNntXdw5isaVfXEEBzz_ya2W9uhTDTDEh4H4EnyFf2UfScXnw/exec";

let STORE_LIST = [];
let EDIT_ID = "";
let EDIT_DATA = null;

window.addEventListener("load", async function(){
  setDefaultMonth();
  await loadStores();
  await loadEditSettlement();
  calculate();
});

function setDefaultMonth(){
  const d = new Date();
  const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  const yyyy = prev.getFullYear();
  const mm = String(prev.getMonth() + 1).padStart(2, "0");

  document.getElementById("month").value =
    yyyy + "-" + mm;
}

async function loadStores(){

  try{

    const res =
      await fetch(
        API_URL + "?action=getStores&t=" + Date.now()
      );

    const data = await res.json();

    STORE_LIST = data.stores || [];

    // 브랜드(상호) 그룹별 정렬 후, 같은 브랜드 안에서는 점포명 가나다순
    STORE_LIST.sort(function(a,b){
      const brandCompare = String(a.brand || "").trim().localeCompare(
        String(b.brand || "").trim(), "ko"
      );
      if(brandCompare !== 0) return brandCompare;

      return String(a.storeName || "").trim().localeCompare(
        String(b.storeName || "").trim(), "ko"
      );
    });

    const select =
      document.getElementById("storeSelect");

    select.innerHTML =
      `<option value="">점포를 선택하세요</option>`;

    STORE_LIST.forEach(function(store,index){

      const opt =
        document.createElement("option");

      opt.value = index;

      opt.textContent =
        store.storeName + " / " + store.market;

      select.appendChild(opt);

    });

  }catch(e){

    showMsg(
      "점포정보를 불러오지 못했습니다.",
      "warn"
    );

  }
}

async function loadEditSettlement(){
  const params = new URLSearchParams(window.location.search);
  const id = String(params.get("editId") || "").trim();
  if(!id) return;

  try{
    const res = await fetch(
      API_URL + "?action=getSettlement&id=" + encodeURIComponent(id) + "&t=" + Date.now(),
      {cache:"no-store"}
    );
    const data = await res.json();

    if(!data || data.success !== true || !data.settlement){
      showMsg((data && data.message) || "수정할 정산자료를 불러오지 못했습니다.","warn");
      return;
    }

    EDIT_ID = id;
    EDIT_DATA = data.settlement;
    fillEditForm(EDIT_DATA);
    setEditModeUI();
  }catch(e){
    console.error(e);
    showMsg("수정할 정산자료를 불러오지 못했습니다.","warn");
  }
}

function fillEditForm(item){
  setVal("month", String(item.month || "").slice(0,7));

  const storeIndex = STORE_LIST.findIndex(function(store){
    return String(store.storeName || "").trim() === String(item.storeName || "").trim();
  });

  if(storeIndex >= 0){
    setVal("storeSelect", String(storeIndex));
    applyStoreInfo();
  }else{
    setVal("brand", item.brand || "");
    setVal("market", item.market || "");
    setVal("region", item.region || "");
  }

  setVal("sales", money(item.sales));
  setVal("commissionRate", percentDisplay(item.commissionRate));
  setVal("commissionAmount", money(item.commissionAmount));
  setVal("utilityCost", money(item.utilityCost));
  setVal("departmentSubtotal", money(item.departmentSubtotal));
  setVal("hqFeeRate", percentDisplay(item.hqFeeRate));
  setVal("hqFeeAmount", money(item.hqFeeAmount));
  setVal("royaltyRate", percentDisplay(item.royaltyRate));
  setVal("royaltyAmount", money(item.royaltyAmount));
  setVal("royaltySubtotal", money(item.royaltySubtotal));
  setVal("hqPurchaseCost", money(item.hqPurchaseCost));
  setVal("macCost", money(item.macCost));
  setVal("lotteCost", money(item.lotteCost));
  setVal("cjCost", money(item.cjCost));
  setVal("etcFoodCost", money(item.etcFoodCost));
  setVal("foodSubtotal", money(item.foodSubtotal));
  setVal("closingFee", money(item.closingFee));
  setVal("otherExpense", money(item.otherExpense));
  setVal("insurancePremium", money(item.insurancePremium));
  setVal("laborCost", money(item.laborCost));
  setVal("socialInsurance", money(item.socialInsurance));
  setVal("cardFee", money(item.cardFee));
  setVal("otherDeduction", money(item.otherDeduction));
  setVal("expenseSubtotal", money(item.expenseSubtotal));
  setVal("paymentStatus", item.paymentStatus || "미지급");
  setVal("paymentDate", item.paymentDate || "");
  setVal("bankAccount", item.bankAccount || "");
  setVal("memo", item.memo || "");

  calculate();
}

function setEditModeUI(){
  const btn = document.getElementById("saveSettlementBtn");
  if(btn){
    btn.textContent = "정산 수정저장";
    btn.classList.add("edit-save");
  }

  const title = document.querySelector(".header h1");
  if(title) title.textContent = "점포별 월정산 수정";

  showMsg("기존 정산자료를 수정하는 중입니다. 정산ID: " + EDIT_ID, "ok");
}

function applyStoreInfo(){

  const idx =
    document.getElementById("storeSelect").value;

  if(idx === "") return;

  const store =
    STORE_LIST[Number(idx)];

  const storeName =
    store.storeName || "";

  const isDongtan =
    storeName.includes("동탄");

  const isTheBigSoba =
    storeName.includes("더큰식탁과 소바공방");

  // 길채정 AK플라자 분당점
  const isBundangAK =
    storeName.includes("길채정") &&
    (storeName.includes("분당") || String(store.market || "").includes("AK"));

  const isShinsegaeSoba =
    storeName.includes("소바공방 시흥신세계프리미엄아울렛점");

  const isPajuShinsegae =
  storeName.includes("파주") &&
  storeName.includes("신세계");

  const isManualCommission =
    isShinsegaeSoba ||
    isPajuShinsegae;  

  document.getElementById("brand").value =
    store.brand || "";

  document.getElementById("market").value =
    store.market || "";

  document.getElementById("region").value =
    store.region || "";

  document.getElementById("commissionRate").value =
    percentDisplay(store.commissionRate);

  document.getElementById("hqFeeRate").value =
    percentDisplay(store.hqFeeRate);

  document.getElementById("royaltyRate").value =
    percentDisplay(store.royaltyRate);

  document.getElementById("taxSalesBox").style.display =
    isDongtan ? "block" : "none";

  document.getElementById("taxFreeSalesBox").style.display =
    isDongtan ? "block" : "none";

  document.getElementById("commissionRateBox").style.display =
  isManualCommission ? "none" : "block";

/*
  * 시흥은 전기료 입력칸을 사용하지 않고,
 */
document.getElementById("utilityCostBox").style.display =
  isManualCommission ? "none" : "block";

document.getElementById("shinsegaePosBox").style.display =
  isManualCommission ? "block" : "none";

document.getElementById("shinsegaeTaxBox").style.display =
  isManualCommission ? "block" : "none";

/*
 * 시흥과 파주는 백화점 수수료를 직접 입력합니다.
 */
document.getElementById("commissionAmount").readOnly =
  !isManualCommission;

  if(isDongtan){

    document.getElementById("commissionRate").value =
      "15";

  }

  if(isTheBigSoba){

    document.getElementById("hqFeeRate").value = "";
    document.getElementById("hqFeeAmount").value =
      "400,000";

  }

  // 길채정 AK플라자 분당점 전용 정산기준
  // 백화점수수료 19%, 본사관리비 3% 고정, 로열티 없음
  if(isBundangAK){
    document.getElementById("commissionRate").value = "19";
    document.getElementById("hqFeeRate").value = "3";
    document.getElementById("royaltyRate").value = "";
  }

  calculate();
}

function calculate(){

  let sales = num("sales");

  const storeIdx =
    document.getElementById("storeSelect").value;

  const store =
    storeIdx === ""
      ? null
      : STORE_LIST[Number(storeIdx)];

  const storeName =
    store ? store.storeName || "" : "";

  const isDongtan =
    storeName.includes("동탄");

  const isTheBigSoba =
    storeName.includes("더큰식탁과 소바공방");

  const isBundangAK =
    storeName.includes("길채정") &&
    (storeName.includes("분당") || (store && String(store.market || "").includes("AK")));

  const isShinsegaeSoba =
    storeName.includes("소바공방 시흥신세계프리미엄아울렛점");

  const isPajuShinsegae =
  storeName.includes("파주") &&
  storeName.includes("신세계");

const isShinsegaeManual =
  isShinsegaeSoba ||
  isPajuShinsegae; 

  let commissionAmount = 0;
  let departmentSubtotal = 0;

  // 동탄 계산
  if(isDongtan){

    const taxSales =
      num("taxSales");

    const taxFreeSales =
      num("taxFreeSales");

    sales =
      taxSales + taxFreeSales;

    const taxCommission =
      taxSales * 0.15;

    const taxFreeCommission =
      taxFreeSales * 0.15 * 1.1;

    commissionAmount =
      taxCommission + taxFreeCommission;

    setVal("sales", money(sales));

    const utilityCost =
      num("utilityCost");

    departmentSubtotal =
      commissionAmount + utilityCost;

  }

  // 시흥 소바공방 · 파주 효종갱 신세계
  else if(isShinsegaeManual){

    commissionAmount =
      num("commissionAmount");

    const posFee =
      num("posFee");

    const taxAmount =
      num("taxAmount");

    departmentSubtotal =
      commissionAmount +
      posFee +
      taxAmount;

  }

  
  // 일반 점포
  else{

    commissionAmount =
      sales * rate("commissionRate");

    const utilityCost =
      num("utilityCost");

    departmentSubtotal =
      commissionAmount + utilityCost;

  }

  setVal(
    "commissionAmount",
    money(commissionAmount)
  );

  let hqFeeAmount = 0;

  if(isTheBigSoba){

    hqFeeAmount = 400000;

  }else if(isBundangAK){

    // AK분당 정산서 수식: ROUNDUP(매출 × 3%, -1)
    hqFeeAmount =
      roundup10(
        sales * 0.03
      );

  }else{

    hqFeeAmount =
      roundup10(
        sales * rate("hqFeeRate")
      );

  }

  const royaltyAmount =
    isBundangAK
      ? 0
      : roundup10(
          sales * rate("royaltyRate")
        );

  const royaltySubtotal =
    hqFeeAmount + royaltyAmount;

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

  const payment =
    sales - totalDeduction;

  setVal(
    "departmentSubtotal",
    money(departmentSubtotal)
  );

  setVal(
    "hqFeeAmount",
    money(hqFeeAmount)
  );

  setVal(
    "royaltyAmount",
    money(royaltyAmount)
  );

  setVal(
    "royaltySubtotal",
    money(royaltySubtotal)
  );

  setVal(
    "foodSubtotal",
    money(foodSubtotal)
  );

  setVal(
    "expenseSubtotal",
    money(expenseSubtotal)
  );

  document.getElementById("sumSales").textContent =
    money(sales);

  document.getElementById("sumDeduction").textContent =
    money(totalDeduction);

  document.getElementById("sumPayment").textContent =
    money(payment);

  document.getElementById("sumRemain").textContent =
    money(payment);
}

async function saveSettlement(){

  const storeIdx =
    document.getElementById("storeSelect").value;

  if(!val("month")){

    showMsg(
      "정산월을 선택하세요.",
      "warn"
    );

    return;
  }

  if(storeIdx === ""){

    showMsg(
      "점포를 선택하세요.",
      "warn"
    );

    return;
  }

  showMsg(
    "정산자료 저장 중입니다.",
    "warn"
  );

  const store =
    STORE_LIST[Number(storeIdx)];

  const attachments =
    await readAllAttachments();

  const settlementMonth =
    val("month").slice(0,7);

  const payload = {

    action: EDIT_ID ? "updateSettlement" : "saveSettlement",
    id: EDIT_ID,

    month:settlementMonth,
    periodText:settlementMonth,

    brand:store.brand,
    storeName:store.storeName,
    market:store.market,
    region:store.region,

    sales:String(num("sales")),

    commissionRate:String(
      rate("commissionRate")
    ),

    commissionAmount:String(
      numText("commissionAmount")
    ),

    utilityCost:String(
      num("utilityCost")
    ),

    departmentSubtotal:String(
      numText("departmentSubtotal")
    ),

    hqFeeRate:String(
      rate("hqFeeRate")
    ),

    hqFeeAmount:String(
      numText("hqFeeAmount")
    ),

    royaltyRate:String(
      rate("royaltyRate")
    ),

    royaltyAmount:String(
      numText("royaltyAmount")
    ),

    royaltySubtotal:String(
      numText("royaltySubtotal")
    ),

    hqPurchaseCost:String(
      num("hqPurchaseCost")
    ),

    macCost:String(
      num("macCost")
    ),

    lotteCost:String(
      num("lotteCost")
    ),

    cjCost:String(
      num("cjCost")
    ),

    etcFoodCost:String(
      num("etcFoodCost")
    ),

    foodCost:String(
      numText("foodSubtotal")
    ),

    foodSubtotal:String(
      numText("foodSubtotal")
    ),

    closingFee:String(
      num("closingFee")
    ),

    otherExpense:String(
      num("otherExpense")
    ),

    insurancePremium:String(
      num("insurancePremium")
    ),

    laborCost:String(
      num("laborCost")
    ),

    socialInsurance:String(
      num("socialInsurance")
    ),

    cardFee:String(
      num("cardFee")
    ),

    otherDeduction:String(
      num("otherDeduction")
    ),

    expenseSubtotal:String(
      numText("expenseSubtotal")
    ),

    paymentStatus:
      val("paymentStatus"),

    paymentDate:
      val("paymentDate"),

    bankAccount:
      val("bankAccount"),

    memo:
      val("memo"),

    settlementFile:
      attachments.settlementFile
  };

  try{

    const res =
      await fetch(API_URL,{
        method:"POST",
        body:JSON.stringify(payload)
      });

    const data =
      await res.json();

    if(data.success){

      const printUrl =
        "https://thebigkorea.github.io/thebigkorea-settlement/settlement-print.html?id=" +
        encodeURIComponent(data.settlementId);

      showMsg(
        (EDIT_ID ? "정산 수정 완료 / 최종정산액: " : "정산 저장 완료 / 최종정산액: ") +
        money(data.paymentAmount),
        "ok"
      );

      document.getElementById("linkArea").innerHTML = `
        <button onclick="copySettlementLink('${printUrl}')">
          정산서 링크 복사
        </button>

        <a href="${printUrl}"
           target="_blank"
           class="link-btn">
          정산서 열기
        </a>
      `;

    }else{

      showMsg(
        data.message || "저장 실패",
        "warn"
      );

    }

  }catch(e){

    showMsg(
      "저장 중 오류가 발생했습니다.",
      "warn"
    );

  }
}

async function readAllAttachments(){
  return {
    settlementFile:
      await readOneFile("settlementFile")
  };
}

function readOneFile(id){

  const input =
    document.getElementById(id);

  const file =
    input.files && input.files[0];

  if(!file)
    return Promise.resolve(null);

  return fileToObject(file);
}

function fileToObject(file){

  return new Promise(function(resolve,reject){

    const reader = new FileReader();

    reader.onload = function(){

      const result =
        String(reader.result || "");

      const base64 =
        result.split(",")[1] || "";

      resolve({
        name:file.name,
        mimeType:
          file.type ||
          "application/octet-stream",
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

  const el =
    document.getElementById(id);

  return el
    ? el.value.trim()
    : "";
}

function setVal(id,value){

  const el =
    document.getElementById(id);

  if(el) el.value = value;
}

function normalizeNumberText(text){

  return String(text || "")
    .replace(/[０-９]/g,function(s){
      return String.fromCharCode(
        s.charCodeAt(0)-65248
      );
    })
    .replace(/,/g,"")
    .replace(/[^0-9.-]/g,"");
}

function num(id){
  return Number(
    normalizeNumberText(val(id))
  ) || 0;
}

function numText(id){
  return num(id);
}

function rate(id){

  const v = Number(
    String(val(id))
      .replace(/[０-９]/g,function(s){
        return String.fromCharCode(
          s.charCodeAt(0)-65248
        );
      })
      .replace("%","")
      .replace(/,/g,"")
      .replace(/[^0-9.]/g,"")
  ) || 0;

  return v / 100;
}

function formatMoneyInput(input){

  const n =
    Number(
      normalizeNumberText(input.value)
    ) || 0;

  input.value =
    n ? money(n) : "";
}

function formatRateInput(input){

  const n = Number(
    String(input.value)
      .replace(/[０-９]/g,function(s){
        return String.fromCharCode(
          s.charCodeAt(0)-65248
        );
      })
      .replace("%","")
      .replace(/[^0-9.]/g,"")
  ) || 0;

  input.value =
    n ? String(n) : "";
}

function percentDisplay(value){

  const n =
    Number(value || 0);

  if(!n) return "";

  return String(n * 100)
    .replace(/\.0$/,"");
}

function money(n){

  return Math.round(
    Number(n || 0)
  ).toLocaleString("ko-KR");
}

function roundup10(value){

  return Math.ceil(
    Number(value || 0) / 10
  ) * 10;
}

function showMsg(text,type){

  const msg =
    document.getElementById("msg");

  msg.textContent = text;
  msg.className = "msg " + type;
}

function copySettlementLink(url){

  navigator.clipboard.writeText(url)
    .then(function(){

      alert(
        "정산서 링크가 복사되었습니다."
      );

    });
}