let latestPageInfo = { url:'', title:'', click:'', x_pct:null, y_pct:null }

chrome.tabs.onActivated.addListener(()=>{
  chrome.tabs.query({active:true,currentWindow:true},(tabs)=>{
    const tab=tabs[0]; if(!tab) return
    latestPageInfo.url=tab.url||''; latestPageInfo.title=tab.title||''
    console.log('ACTIVE TAB:',latestPageInfo.url)
  })
})

chrome.tabs.onUpdated.addListener((tabId,changeInfo,tab)=>{
  if(tab.active && changeInfo.status==='complete'){
    latestPageInfo.url=tab.url||''; latestPageInfo.title=tab.title||''
    console.log('UPDATED TAB:',latestPageInfo.url)
  }
})

// ── Helper: find ExpertRecorder tab ──────────────────────────
function findRecorderTab(callback){
  chrome.tabs.query({},(tabs)=>{
    const tab=tabs.find(t=>t.url&&(
      t.url.includes('localhost:3000') ||
      t.url.includes('localhost:3001') ||
      t.url.includes('vercel.app')
    ))
    callback(tab||null)
  })
}

chrome.runtime.onMessage.addListener((msg,sender,sendResponse)=>{

  // ── Page info ─────────────────────────────────────────────
  if(msg.type==='vaiga-page-info'){
    console.log('BACKGROUND RECEIVED URL:',msg.url)
    latestPageInfo.url=msg.url||''; latestPageInfo.title=msg.title||''
    sendResponse({ok:true}); return true
  }

  // ── Click info + RELAY TO EXPERTRECORDER ─────────────────
  if(msg.type==='vaiga-click-info'){
    latestPageInfo.url=msg.url||''; latestPageInfo.title=msg.title||''
    latestPageInfo.click=msg.text||''
    latestPageInfo.x_pct=msg.x_pct; latestPageInfo.y_pct=msg.y_pct

    // Capture screenshot from sender tab + relay
    if(sender.tab?.id){
      chrome.tabs.captureVisibleTab(
        sender.tab.windowId,
        {format:'jpeg',quality:60},
        (dataUrl)=>{
          const img_b64=dataUrl?dataUrl.split(',')[1]:''
          findRecorderTab((recorderTab)=>{
            if(!recorderTab) return
            if(sender.tab.id===recorderTab.id) return  // don't relay self
            chrome.tabs.sendMessage(recorderTab.id,{
              type:  'vaiga-click-relay',
              x_pct: msg.x_pct,
              y_pct: msg.y_pct,
              text:  msg.text,
              url:   msg.url,
              title: msg.title,
              image: img_b64,   // ← real screenshot from external page
            }).catch(()=>{})
          })
        }
      )
    }

    sendResponse({ok:true}); return true
  }

  // ── Get page info ─────────────────────────────────────────
  if(msg.type==='get-page-info'){
    sendResponse(latestPageInfo); return true
  }

  // ── Mini broadcast ────────────────────────────────────────
  if(msg.type==='vaiga-mini-broadcast'){
    chrome.tabs.query({active:true,currentWindow:true},(tabs)=>{
      tabs.forEach(tab=>{
        chrome.scripting.executeScript({target:{tabId:tab.id},files:['content.js']}).catch(()=>{})
        chrome.tabs.sendMessage(tab.id,{type:'vaiga-mini-open'}).catch(()=>{})
      })
    })
    return true
  }

  // ── Screenshot ────────────────────────────────────────────
  if(msg.type==='capture-screenshot'){
    const windowId=sender.tab?.windowId||null
    chrome.tabs.captureVisibleTab(windowId,{format:'jpeg',quality:70},(dataUrl)=>{
      sendResponse({dataUrl})
    })
    return true
  }

  // ── Screen vision ─────────────────────────────────────────
  if(msg.type==='screen-vision-fetch'){
    fetch('https://appreciate-delays-festivals-rated.trycloudflare.com',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({image:msg.img_b64,question:msg.question})
    })
    .then(r=>r.json())
    .then(d=>sendResponse({answer:(d.description||'').replace(/\n/g,' ').trim()}))
    .catch(()=>sendResponse({answer:''}))
    return true
  }

  // ── WhatsApp send ─────────────────────────────────────────
  if(msg.type==='whatsapp-send'){
    const {phone,message}=msg
    const url=`https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`
    chrome.tabs.create({url},(tab)=>{
      const tryClick=(attempt)=>{
        if(attempt>15) return
        setTimeout(()=>{
          chrome.scripting.executeScript({
            target:{tabId:tab.id},
            func:()=>{
              const btn=
                document.querySelector('[data-testid="send"]')||
                document.querySelector('span[data-icon="send"]')?.closest('button')||
                document.querySelector('button[aria-label="Send"]')||
                document.querySelector('button[aria-label="Send message"]')
              if(btn){btn.click();return true}
              return false
            }
          },(results)=>{
            if(!results?.[0]?.result) tryClick(attempt+1)
          })
        },2000)
      }
      tryClick(0)
    })
    sendResponse({ok:true}); return true
  }

  // ── Open URL ──────────────────────────────────────────────
  if(msg.type==='open-url'){
    chrome.tabs.create({url:msg.url})
    sendResponse({ok:true}); return true
  }

})