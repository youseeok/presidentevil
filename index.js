// Worker: melayani /api/scores (ranking, disimpan di KV "SCORES"); selain itu menyajikan game dari folder public.
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const load=async env=>JSON.parse((await env.SCORES.get('top'))||'[]');
async function post(request,env){
  let b;try{b=await request.json()}catch{return json({error:'bad'},400)}
  const name=String(b.name||'Anonim').replace(/[<>&"'`]/g,'').trim().slice(0,16)||'Anonim';
  const score=Math.floor(Number(b.score)),year=Math.floor(Number(b.year)),dur=Math.floor(Number(b.dur));
  if(!(score>=0&&score<=1000000)||!(year>=1&&year<=5)||!(dur>=5)||score>dur*1500+1000)return json({error:'invalid'},400);
  const rk='rl:'+(request.headers.get('CF-Connecting-IP')||'x');
  if(await env.SCORES.get(rk))return json({error:'too many'},429);
  await env.SCORES.put(rk,'1',{expirationTtl:60});
  let l=await load(env);l.push({name,score,year});l.sort((a,b)=>b.score-a.score);
  const rank=l.findIndex(e=>e.name===name&&e.score===score)+1;l=l.slice(0,100);
  await env.SCORES.put('top',JSON.stringify(l));
  return json({rank,scores:l.slice(0,50)});
}
export default{
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname==='/api/scores'){
      if(request.method==='GET')return json({scores:(await load(env)).slice(0,50)});
      if(request.method==='POST')return post(request,env);
      return json({error:'method'},405);
    }
    return env.ASSETS.fetch(request);
  }
};
