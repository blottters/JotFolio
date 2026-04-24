// AI providers — BYOK. User supplies key; app calls provider when feature needs AI.
// Stored in localStorage under 'mgn-ai'. Reads via getAIConfig / writes via setAIConfig.
export const AI_PROVIDERS = {
  anthropic:{label:'Anthropic',models:['claude-opus-4-7','claude-sonnet-4-6','claude-haiku-4-5-20251001'],url:'https://api.anthropic.com/v1/messages'},
  openai:{label:'OpenAI',models:['gpt-4o','gpt-4o-mini','o1-mini'],url:'https://api.openai.com/v1/chat/completions'},
  gemini:{label:'Google Gemini',models:['gemini-2.0-flash','gemini-1.5-pro','gemini-1.5-flash'],url:'https://generativelanguage.googleapis.com/v1beta/models'},
  groq:{label:'Groq',models:['llama-3.3-70b-versatile','mixtral-8x7b-32768'],url:'https://api.groq.com/openai/v1/chat/completions'},
  openrouter:{label:'OpenRouter',models:['anthropic/claude-sonnet-4','openai/gpt-4o','meta-llama/llama-3.1-70b-instruct'],url:'https://openrouter.ai/api/v1/chat/completions'},
  ollama:{label:'Ollama (local)',models:['llama3.2','qwen2.5','mistral'],url:'http://localhost:11434/api/generate'},
  custom:{label:'Custom (OpenAI-compat)',models:[],url:''},
};
export function getAIConfig(){try{const v=localStorage.getItem('mgn-ai');return v?JSON.parse(v):null}catch{return null}}
export function setAIConfig(cfg){try{if(cfg)localStorage.setItem('mgn-ai',JSON.stringify(cfg));else localStorage.removeItem('mgn-ai')}catch{}}
export function hasAIKey(){const c=getAIConfig();return!!(c&&c.enabled&&c.key)}

// Single entrypoint for AI calls. Features across the app use this so provider
// swaps don't ripple. Returns plain text; set `json:true` to auto-parse JSON reply.
export async function aiComplete({system,user,json=false,maxTokens=500,signal}){
  const cfg=getAIConfig();
  if(!cfg||!cfg.enabled||!cfg.key)throw new Error('AI not configured');
  const p=cfg.provider,model=cfg.model,key=cfg.key,url=cfg.customUrl||AI_PROVIDERS[p]?.url;
  const h={'Content-Type':'application/json'};
  let body,endpoint=url,parse;
  if(p==='anthropic'){
    h['x-api-key']=key;h['anthropic-version']='2023-06-01';
    body={model,max_tokens:maxTokens,system,messages:[{role:'user',content:user}]};
    parse=d=>d?.content?.[0]?.text||'';
  }else if(p==='gemini'){
    endpoint=`${url}/${model}:generateContent?key=${encodeURIComponent(key)}`;
    body={systemInstruction:{parts:[{text:system||''}]},contents:[{role:'user',parts:[{text:user}]}],generationConfig:{maxOutputTokens:maxTokens}};
    parse=d=>d?.candidates?.[0]?.content?.parts?.[0]?.text||'';
  }else if(p==='ollama'){
    body={model,system,prompt:user,stream:false,options:{num_predict:maxTokens}};
    parse=d=>d?.response||'';
  }else{
    // OpenAI + Groq + OpenRouter + custom = OpenAI-compatible
    h['Authorization']=`Bearer ${key}`;
    body={model,max_tokens:maxTokens,messages:[{role:'system',content:system||''},{role:'user',content:user}]};
    if(json)body.response_format={type:'json_object'};
    parse=d=>d?.choices?.[0]?.message?.content||'';
  }
  const res=await fetch(endpoint,{method:'POST',headers:h,body:JSON.stringify(body),signal});
  if(!res.ok){const t=await res.text();throw new Error(`AI ${res.status}: ${t.slice(0,160)}`)}
  const data=await res.json();
  const text=parse(data).trim();
  if(json){try{return JSON.parse(text.match(/\{[\s\S]*\}/)?.[0]||text)}catch{return text}}
  return text;
}
