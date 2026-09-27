function initHexAnim(){
  const c=document.getElementById('hexParticles'); if(!c) return; const ctx=c.getContext('2d');
  function resize(){c.width=c.offsetWidth;c.height=c.offsetHeight} resize();
  let dots=[...Array(70)].map(()=>({x:Math.random()*c.width,y:Math.random()*c.height,vx:(Math.random()-.5)*0.5,vy:(Math.random()-.5)*0.5,r:Math.random()*1.5+0.8}));
  (function loop(){
    ctx.clearRect(0,0,c.width,c.height);
    dots.forEach(d=>{
      d.x+=d.vx; d.y+=d.vy;
      if(d.x<0||d.x>c.width)d.vx*=-1; if(d.y<0||d.y>c.height)d.vy*=-1;
      ctx.shadowBlur=12; ctx.shadowColor='#ff8a2a';
      ctx.fillStyle='rgba(255,138,42,0.9)';
      ctx.beginPath(); ctx.arc(d.x,d.y,d.r,0,Math.PI*2); ctx.fill();
    });
    requestAnimationFrame(loop);
  })();
  document.querySelectorAll('.hex-card').forEach(card=>{
    card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect();card.style.setProperty('--x',(e.clientX-r.left)+'px');card.style.setProperty('--y',(e.clientY-r.top)+'px');});
  });
  document.querySelectorAll('.hex-btn').forEach(btn=>{
    btn.addEventListener('pointermove',e=>{const r=btn.getBoundingClientRect();btn.style.setProperty('--bx',(e.clientX-r.left)+'px');btn.style.setProperty('--by',(e.clientY-r.top)+'px');});
  });
}