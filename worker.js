/*
 * OPD Web Portal - install-free KIPRIS Plus viewer
 * Deploy this single Module Worker once. End users only open its HTTPS URL.
 * The user's API key is never persisted or logged by this code.
 */

const KIPRIS_ORIGIN = "https://plus.kipris.or.kr";
const MAX_BODY_BYTES = 4096;
const MAX_XML_BYTES = 2_000_000;

const HTML = String.raw`<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>국제심사정보 통합조회</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <header class="top">
    <div class="wrap header-row">
      <div><h1>국제심사정보 통합조회</h1><p>KIPRIS Plus 출원 현황 조회</p></div>
      <button id="forgetKey" class="ghost hidden" type="button">API Key 변경</button>
    </div>
  </header>
  <main class="wrap">
    <section id="keyPanel" class="card key-card">
      <span class="eyebrow">처음 한 번</span>
      <h2>KIPRIS Plus API Key 입력</h2>
      <p>다른 설정은 필요하지 않습니다. Key는 서버에 저장하지 않으며 현재 브라우저 탭에서만 사용합니다.</p>
      <label class="label" for="apiKey">API Key</label>
      <div class="key-row">
        <input id="apiKey" type="password" autocomplete="off" spellcheck="false" placeholder="발급받은 API Key">
        <button id="toggleKey" class="secondary" type="button">보기</button>
      </div>
      <button id="useKey" class="primary full" type="button">조회 화면 시작</button>
      <div id="keyState" class="state" aria-live="polite">API Key만 입력하면 바로 시작합니다.</div>
    </section>

    <section id="searchPanel" class="hidden">
      <div class="search card">
        <label class="sr-only" for="applicationNumber">출원번호</label>
        <input id="applicationNumber" inputmode="numeric" maxlength="40" placeholder="출원번호 예: 10-2023-0028266">
        <button id="search" class="primary" type="button">현황 조회</button>
      </div>
      <div id="searchState" class="state" aria-live="polite">출원번호를 입력해 주세요.</div>

      <section id="summary" class="card hidden">
        <div class="section-title"><div><span class="eyebrow">종합현황</span><h2 id="title">조회 결과</h2></div><span id="statusBadge" class="badge">확인 중</span></div>
        <dl id="summaryGrid" class="summary-grid"></dl>
      </section>

      <section id="history" class="card hidden">
        <div class="section-title"><div><span class="eyebrow">진행사항</span><h2>법적상태 이력</h2></div></div>
        <div id="historyList" class="timeline"></div>
      </section>

      <section id="citations" class="card hidden">
        <div class="section-title"><div><span class="eyebrow">심사자료</span><h2>인용문헌</h2></div></div>
        <div class="table-wrap"><table><thead><tr><th>구분</th><th>문헌정보</th></tr></thead><tbody id="citationRows"></tbody></table></div>
      </section>

      <section id="partial" class="card warning hidden">
        <h2>일부 정보 안내</h2><ul id="partialList"></ul>
      </section>

      <details id="raw" class="card hidden"><summary>API 원문(XML) 보기</summary><div id="rawBlocks"></div></details>
    </section>
    <p class="foot">브라우저 설정·확장프로그램·프록시를 변경하지 않습니다. 조회 결과는 KIPRIS Plus 제공 범위와 사용자의 API 상품 권한에 따라 달라질 수 있습니다.</p>
  </main>
  <script src="/app.js" defer></script>
</body>
</html>`;

const CSS = String.raw`
:root{--navy:#102a43;--navy2:#174b78;--blue:#2563eb;--line:#dfe6ee;--bg:#f4f7fb;--text:#172033;--muted:#667085;--red:#b42318;--green:#087253;--amber:#9a6700}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.55 system-ui,-apple-system,"Segoe UI","Malgun Gothic",sans-serif}.wrap{width:min(1040px,calc(100% - 30px));margin:auto}.top{background:linear-gradient(120deg,var(--navy),var(--navy2));color:#fff;padding:27px 0 54px}.header-row{display:flex;align-items:center;justify-content:space-between;gap:16px}h1{font-size:27px;margin:0}.top p{margin:4px 0 0;color:#d2deea}.card{background:#fff;border:1px solid var(--line);border-radius:17px;padding:20px;margin-bottom:14px;box-shadow:0 8px 28px #102a430d}.key-card{max-width:620px;margin:-27px auto 18px;padding:27px}.key-card h2,.section-title h2{margin:2px 0 6px}.key-card p{color:var(--muted)}.eyebrow{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--blue);font-weight:800}.label{display:block;margin:18px 0 6px;font-weight:750}.key-row{display:grid;grid-template-columns:1fr auto;gap:8px;margin-bottom:10px}input,button{font:inherit;border-radius:10px}input{width:100%;border:1px solid var(--line);padding:12px;background:#fff;color:var(--text)}button{cursor:pointer;font-weight:750}.primary{border:0;background:var(--blue);color:#fff;padding:12px 18px}.secondary{border:1px solid var(--line);background:#f8fafc;color:#344054;padding:10px 14px}.ghost{border:1px solid #ffffff66;background:transparent;color:#fff;padding:9px 13px}.full{width:100%}.search{margin-top:-27px;display:grid;grid-template-columns:1fr auto;gap:9px;box-shadow:0 12px 35px #102a4320}.state{margin:13px 0;padding:11px 13px;border-radius:10px;background:#fff;border:1px solid var(--line);color:var(--muted)}.state.error{background:#fff0f0;color:var(--red)}.state.ok{background:#e8f7f1;color:var(--green)}.section-title{display:flex;align-items:center;justify-content:space-between;gap:12px}.badge{border-radius:999px;padding:6px 10px;background:#eef4ff;color:#2353a4;font-weight:800;font-size:12px}.summary-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:12px;overflow:hidden;margin:15px 0 0}.summary-grid div{background:#fff;padding:11px 13px}.summary-grid dt{font-size:11px;color:var(--muted);font-weight:750}.summary-grid dd{margin:3px 0 0;word-break:break-word}.timeline{margin-top:15px}.event{position:relative;margin-left:7px;padding:0 0 17px 23px;border-left:2px solid #d9e3ef}.event:last-child{border-left-color:transparent}.event:before{content:"";position:absolute;left:-6px;top:4px;width:10px;height:10px;border-radius:50%;background:var(--blue)}.event strong{display:block}.event time,.event p{display:block;color:var(--muted);margin:2px 0}.table-wrap{overflow:auto;margin-top:12px}table{width:100%;border-collapse:collapse}th,td{text-align:left;vertical-align:top;padding:10px;border-bottom:1px solid #edf0f4}th{font-size:12px;background:#f8fafc}.warning{border-left:4px solid #d89a23;background:#fffaf0}.warning h2{font-size:16px;margin-top:0}.warning li{color:var(--amber);margin:5px 0}details summary{cursor:pointer;font-weight:750}pre{white-space:pre-wrap;word-break:break-word;background:#0f172a;color:#dce7f4;padding:12px;border-radius:10px;max-height:420px;overflow:auto;font-size:12px}.foot{font-size:12px;color:var(--muted);margin:16px 0 30px}.hidden{display:none!important}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}
@media(max-width:680px){.summary-grid{grid-template-columns:1fr}.search{grid-template-columns:1fr}.header-row{align-items:flex-start}h1{font-size:22px}.key-card{padding:20px}}
`;

const APP_JS = String.raw`
(() => {
  "use strict";
  const el = id => document.getElementById(id);
  const keyPanel=el("keyPanel"),searchPanel=el("searchPanel"),apiKey=el("apiKey"),keyState=el("keyState"),searchState=el("searchState");
  let memoryKey="";
  const storage={get(){try{return sessionStorage.getItem("opd-kipris-key")||""}catch(_){return memoryKey}},set(value){memoryKey=value;try{sessionStorage.setItem("opd-kipris-key",value)}catch(_){}},clear(){memoryKey="";try{sessionStorage.removeItem("opd-kipris-key")}catch(_){}}};
  function state(node,text,kind){node.textContent=text;node.className="state"+(kind?" "+kind:"")}
  function showSearch(){keyPanel.classList.add("hidden");searchPanel.classList.remove("hidden");el("forgetKey").classList.remove("hidden");el("applicationNumber").focus()}
  function showKey(){searchPanel.classList.add("hidden");keyPanel.classList.remove("hidden");el("forgetKey").classList.add("hidden");apiKey.focus()}
  function normalizeNumber(value){const raw=value.trim();if(!/^[0-9\-\s]+$/.test(raw))throw new Error("출원번호에는 숫자와 하이픈만 입력해 주세요.");const number=raw.replace(/\D/g,"");if(number.length<9||number.length>13)throw new Error("출원번호 길이를 확인해 주세요.");return number}
  function xmlDoc(text){if(!text)return null;const doc=new DOMParser().parseFromString(text,"application/xml");if(doc.getElementsByTagName("parsererror").length)throw new Error("KIPRIS Plus XML을 해석할 수 없습니다.");return doc}
  function elementsByLocal(doc,name){return doc?Array.from(doc.getElementsByTagName("*")).filter(node=>node.localName===name):[]}
  function firstText(doc,names){for(const name of names){const node=elementsByLocal(doc,name)[0];if(node&&node.textContent.trim())return node.textContent.trim()}return ""}
  function itemNodes(doc){const items=elementsByLocal(doc,"item");return items.length?items:elementsByLocal(doc,"Item")}
  function leafMap(node){const out={};for(const child of Array.from(node.children||[])){if(!child.children.length){const value=child.textContent.trim();if(value)out[child.localName]=value}}return out}
  function addSummary(label,value){if(!value)return;const box=document.createElement("div"),dt=document.createElement("dt"),dd=document.createElement("dd");dt.textContent=label;dd.textContent=value;box.append(dt,dd);el("summaryGrid").append(box)}
  function renderSummary(doc,number){el("summaryGrid").textContent="";const title=firstText(doc,["inventionTitle","inventionName"])||"출원 "+number;const status=firstText(doc,["registerStatus","legalStatusName","status"])||"상태 확인";el("title").textContent=title;el("statusBadge").textContent=status;addSummary("출원번호",firstText(doc,["applicationNumber"])||number);addSummary("출원일자",firstText(doc,["applicationDate"]));addSummary("출원인",firstText(doc,["applicantName"]));addSummary("공개번호",firstText(doc,["openNumber"]));addSummary("공개일자",firstText(doc,["openDate"]));addSummary("등록번호",firstText(doc,["registerNumber","registrationNumber"]));addSummary("등록일자",firstText(doc,["registerDate","registrationDate"]));addSummary("IPC",firstText(doc,["ipcNumber"]));el("summary").classList.remove("hidden")}
  function renderHistory(doc){const list=el("historyList");list.textContent="";const items=itemNodes(doc);for(const node of items.slice(0,200)){const map=leafMap(node),name=map.legalStatusName||map.documentName||map.statusName||"처리 이력",date=map.legalStatusDate||map.processDate||map.date||"",comment=map.legalStatusComment||map.comment||map.processStatus||"";const event=document.createElement("article"),strong=document.createElement("strong"),time=document.createElement("time");event.className="event";strong.textContent=name;time.textContent=date;event.append(strong,time);if(comment){const p=document.createElement("p");p.textContent=comment;event.append(p)}list.append(event)}if(!list.children.length){const p=document.createElement("p");p.textContent="제공된 이력이 없습니다.";list.append(p)}el("history").classList.remove("hidden")}
  function renderCitations(doc){const rows=el("citationRows");rows.textContent="";for(const node of itemNodes(doc).slice(0,200)){const map=leafMap(node),tr=document.createElement("tr"),type=document.createElement("td"),info=document.createElement("td");type.textContent=map.citationCategory||map.category||map.kind||"인용문헌";const values=Object.entries(map).filter(entry=>entry[1]).map(entry=>entry[0]+": "+entry[1]);info.textContent=values.join(" · ");tr.append(type,info);rows.append(tr)}if(rows.children.length)el("citations").classList.remove("hidden")}
  function renderRaw(sources){const root=el("rawBlocks");root.textContent="";for(const source of sources){if(!source.xml)continue;const h=document.createElement("h3"),pre=document.createElement("pre");h.textContent=source.label;pre.textContent=source.xml;root.append(h,pre)}el("raw").classList.remove("hidden")}
  function hideResults(){for(const id of ["summary","history","citations","partial","raw"])el(id).classList.add("hidden")}
  async function search(){hideResults();const key=storage.get();if(!key){showKey();state(keyState,"API Key를 다시 입력해 주세요.","error");return}let number;try{number=normalizeNumber(el("applicationNumber").value)}catch(error){state(searchState,error.message,"error");return}const button=el("search");button.disabled=true;state(searchState,"KIPRIS Plus에서 현황을 조회하고 있습니다…");try{const response=await fetch("/api/search",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({apiKey:key,applicationNumber:number})});const data=await response.json();if(!response.ok)throw new Error(data.error||("HTTP "+response.status));const basic=xmlDoc(data.sources.basic&&data.sources.basic.xml),history=xmlDoc(data.sources.history&&data.sources.history.xml),citations=xmlDoc(data.sources.citations&&data.sources.citations.xml);renderSummary(basic||history,number);if(history)renderHistory(history);if(citations)renderCitations(citations);const errors=Object.values(data.sources).filter(source=>source.error).map(source=>source.label+": "+source.error);if(errors.length){const ul=el("partialList");ul.textContent="";for(const message of errors){const li=document.createElement("li");li.textContent=message;ul.append(li)}el("partial").classList.remove("hidden")}renderRaw(Object.values(data.sources));state(searchState,"조회가 완료되었습니다.","ok")}catch(error){state(searchState,"조회 실패: "+error.message,"error")}finally{button.disabled=false}}
  el("toggleKey").onclick=()=>{const visible=apiKey.type==="text";apiKey.type=visible?"password":"text";el("toggleKey").textContent=visible?"보기":"숨김"};
  el("useKey").onclick=()=>{const value=apiKey.value.trim();if(value.length<16){state(keyState,"API Key를 정확히 입력해 주세요.","error");return}storage.set(value);apiKey.value="";showSearch()};
  el("forgetKey").onclick=()=>{storage.clear();hideResults();showKey();state(keyState,"새 API Key를 입력해 주세요.","")};
  el("search").onclick=search;el("applicationNumber").addEventListener("keydown",event=>{if(event.key==="Enter")search()});apiKey.addEventListener("keydown",event=>{if(event.key==="Enter")el("useKey").click()});
  if(storage.get())showSearch();else showKey();
})();
`;

function headers(contentType) {
  return {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
    "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
  };
}

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: headers("application/json; charset=utf-8") });
}

function validate(apiKey, rawNumber) {
  if (typeof apiKey !== "string" || apiKey.length < 16 || apiKey.length > 512 || /[\x00-\x20\x7f]/.test(apiKey)) {
    throw new Error("API Key 형식을 확인해 주세요.");
  }
  if (typeof rawNumber !== "string" || !/^[0-9]{9,13}$/.test(rawNumber)) {
    throw new Error("출원번호 형식을 확인해 주세요.");
  }
  return { apiKey, applicationNumber: rawNumber };
}

async function readLimited(response) {
  const declared = Number(response.headers.get("content-length") || 0);
  if (declared > MAX_XML_BYTES) throw new Error("응답 크기가 허용 범위를 초과했습니다.");
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_XML_BYTES) throw new Error("응답 크기가 허용 범위를 초과했습니다.");
  const text = new TextDecoder("utf-8").decode(buffer);
  const head = text.slice(0, 2048).toUpperCase();
  if (head.includes("<!DOCTYPE") || head.includes("<!ENTITY")) throw new Error("허용되지 않은 XML 응답입니다.");
  return text;
}

async function kipris(label, path, params) {
  const url = new URL(path, KIPRIS_ORIGIN);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { "Accept": "application/xml,text/xml" },
      signal: controller.signal
    });
    if (!response.ok) throw new Error("KIPRIS Plus 응답 오류("+response.status+")");
    return { label, xml: await readLimited(response) };
  } catch (error) {
    const message = error && error.name === "AbortError" ? "응답 시간이 초과되었습니다." : (error.message || "연결할 수 없습니다.");
    return { label, error: message };
  } finally {
    clearTimeout(timer);
  }
}

async function handleSearch(request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_BODY_BYTES) return json(413, { error: "요청 크기가 너무 큽니다." });
  let body;
  try { body = await request.json(); } catch (_) { return json(400, { error: "요청 형식이 올바르지 않습니다." }); }
  let input;
  try { input = validate(body.apiKey, body.applicationNumber); } catch (error) { return json(400, { error: error.message }); }

  const common = { applicationNumber: input.applicationNumber };
  const [basic, history, citations] = await Promise.all([
    kipris("출원 종합정보", "/kipo-api/kipi/patUtiModInfoSearchSevice/getAdvancedSearch", { ...common, ServiceKey: input.apiKey, pageNo: "1", numOfRows: "10" }),
    kipris("법적상태 이력", "/kipo-api/kipi/legStatusInfoSearchService/getLegStatusHistoryInfoSearch", { ...common, ServiceKey: input.apiKey }),
    kipris("심사 인용문헌", "/openapi/rest/CitationService/citationInfoV3", { ...common, accessKey: input.apiKey })
  ]);
  if ([basic, history, citations].every(source => source.error)) {
    return json(502, { error: "KIPRIS Plus 연결 또는 API 상품 권한을 확인해 주세요.", sources: { basic, history, citations } });
  }
  return json(200, { sources: { basic, history, citations } });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/") return new Response(HTML, { headers: headers("text/html; charset=utf-8") });
    if (request.method === "GET" && url.pathname === "/style.css") return new Response(CSS, { headers: headers("text/css; charset=utf-8") });
    if (request.method === "GET" && url.pathname === "/app.js") return new Response(APP_JS, { headers: headers("text/javascript; charset=utf-8") });
    if (request.method === "POST" && url.pathname === "/api/search") return handleSearch(request);
    return json(404, { error: "찾을 수 없습니다." });
  }
};
