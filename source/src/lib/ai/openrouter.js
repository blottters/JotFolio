// OpenRouter PKCE OAuth. User clicks login → redirect to OpenRouter → approves
// → redirects back with ?code= → we exchange for key via POST /api/v1/auth/keys.
export const OR_VERIFIER_KEY='mgn-or-pkce';
function _b64url(bytes){return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'')}
async function _pkcePair(){
  const arr=crypto.getRandomValues(new Uint8Array(32));
  const verifier=_b64url(arr);
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));
  return{verifier,challenge:_b64url(new Uint8Array(hash))};
}
export async function startOpenRouterLogin(){
  const{verifier,challenge}=await _pkcePair();
  sessionStorage.setItem(OR_VERIFIER_KEY,verifier);
  const cb=window.location.origin+window.location.pathname;
  window.location.href=`https://openrouter.ai/auth?callback_url=${encodeURIComponent(cb)}&code_challenge=${challenge}&code_challenge_method=S256`;
}
export async function exchangeOpenRouterCode(code){
  const verifier=sessionStorage.getItem(OR_VERIFIER_KEY);
  if(!verifier)throw new Error('Missing PKCE verifier (session lost?)');
  const res=await fetch('https://openrouter.ai/api/v1/auth/keys',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({code,code_verifier:verifier,code_challenge_method:'S256'})
  });
  if(!res.ok)throw new Error(`Exchange ${res.status}: ${(await res.text()).slice(0,160)}`);
  const data=await res.json();
  sessionStorage.removeItem(OR_VERIFIER_KEY);
  return data.key;
}
