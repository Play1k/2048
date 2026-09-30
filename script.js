// ---------- storage helpers ----------
const LB_KEY='play1k_leaderboard';
const loadJSON=(k,fallback)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):fallback}catch(e){return fallback}};
const saveJSON=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
let leaderboard=loadJSON(LB_KEY,[]);
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

// ---------- 2048 game engine (tile-identity based, for smooth animation) ----------
const SIZE=4, SLIDE_MS=120, MERGE_MS=160, GAP=10;
let tileGrid, tiles, tileIdCounter=0, score=0, best=0, over=false, won=false, animating=false, cellPx=0;
const tilesEl=document.getElementById('tiles'), gridEl=document.getElementById('grid'), boardWrap=document.getElementById('boardWrap');
const overlay=document.getElementById('overlay'), overlayMsg=document.getElementById('overlayMsg');

function buildStaticGrid(){
  gridEl.innerHTML='';
  for(let i=0;i<SIZE*SIZE;i++){const d=document.createElement('div');d.className='cell';gridEl.appendChild(d)}
}
function cellSize(){
  const w=tilesEl.getBoundingClientRect().width;
  cellPx=(w-GAP*(SIZE-1))/SIZE;
}
function positionEl(el,row,col){
  el.style.width=cellPx+'px'; el.style.height=cellPx+'px';
  el.style.transform=`translate(${col*(cellPx+GAP)}px, ${row*(cellPx+GAP)}px)`;
}
function tileColor(v){
  const map={2:'#3A2A50',4:'#4C3468',8:'#F2637B',16:'#F2807B',32:'#F2A24D',64:'#F2B807',128:'#E8CE4D',256:'#C7DE4D',512:'#A6E22E',1024:'#7ED957',2048:'#39D98A'};
  return map[v]||'#39D98A';
}
function updateTileVisual(inner,value){
  inner.textContent=value;
  inner.style.background=tileColor(value);
  inner.style.color = value<=4 ? '#F5EFE6' : '#241203';
  inner.style.fontSize = value>=1024? '20px' : value>=128 ? '24px' : '28px';
}
function createTileElement(tile){
  const outer=document.createElement('div'); outer.className='tile-pos';
  const inner=document.createElement('div'); inner.className='tile-inner pop-in';
  updateTileVisual(inner,tile.value);
  outer.appendChild(inner);
  positionEl(outer,tile.row,tile.col);
  tilesEl.appendChild(outer);
  tile.el=outer; tile.innerEl=inner;
}
function cellsAvailable(){for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(!tileGrid[r][c])return true;return false}
function movesAvailable(){
  for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
    if(!tileGrid[r][c])return true;
    const v=tileGrid[r][c].value;
    if(c<SIZE-1 && tileGrid[r][c+1] && tileGrid[r][c+1].value===v)return true;
    if(r<SIZE-1 && tileGrid[r+1][c] && tileGrid[r+1][c].value===v)return true;
  }
  return false;
}
function addRandomTile(){
  const empties=[];
  for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(!tileGrid[r][c])empties.push([r,c]);
  if(!empties.length)return;
  const [r,c]=empties[Math.floor(Math.random()*empties.length)];
  const tile={id:++tileIdCounter,value:Math.random()<0.9?2:4,row:r,col:c};
  tileGrid[r][c]=tile; tiles.push(tile);
  createTileElement(tile);
}
function getLines(dir){
  const lines=[];
  if(dir===0){for(let r=0;r<SIZE;r++){const l=[];for(let c=0;c<SIZE;c++)l.push([r,c]);lines.push(l)}}
  else if(dir===2){for(let r=0;r<SIZE;r++){const l=[];for(let c=SIZE-1;c>=0;c--)l.push([r,c]);lines.push(l)}}
  else if(dir===1){for(let c=0;c<SIZE;c++){const l=[];for(let r=0;r<SIZE;r++)l.push([r,c]);lines.push(l)}}
  else {for(let c=0;c<SIZE;c++){const l=[];for(let r=SIZE-1;r>=0;r--)l.push([r,c]);lines.push(l)}}
  return lines;
}
function move(dir){
  if(over||animating)return;
  const lines=getLines(dir);
  let moved=false, gainedTotal=0;
  const removals=[];
  lines.forEach(line=>{
    const lineTiles=line.map(([r,c])=>tileGrid[r][c]).filter(t=>t!==null);
    let i=0, outIdx=0;
    while(i<lineTiles.length){
      const cur=lineTiles[i], nxt=lineTiles[i+1];
      const [tr,tc]=line[outIdx];
      if(nxt && nxt.value===cur.value){
        cur.value*=2; cur.justMerged=true;
        gainedTotal+=cur.value;
        if(cur.row!==tr||cur.col!==tc)moved=true;
        cur.row=tr; cur.col=tc;
        if(nxt.row!==tr||nxt.col!==tc)moved=true;
        removals.push({tile:nxt,row:tr,col:tc});
        i+=2;
      }else{
        if(cur.row!==tr||cur.col!==tc)moved=true;
        cur.row=tr; cur.col=tc;
        i+=1;
      }
      outIdx++;
    }
  });
  if(!moved)return;
  animating=true;
  tileGrid=Array.from({length:SIZE},()=>Array(SIZE).fill(null));
  const removedIds=new Set(removals.map(r=>r.tile.id));
  tiles=tiles.filter(t=>!removedIds.has(t.id));
  tiles.forEach(t=>tileGrid[t.row][t.col]=t);
  tiles.forEach(t=>positionEl(t.el,t.row,t.col));
  removals.forEach(r=>positionEl(r.tile.el,r.row,r.col));
  score+=gainedTotal; if(score>best)best=score;
  updateHud();
  setTimeout(()=>{
    removals.forEach(r=>r.tile.el.remove());
    tiles.forEach(t=>{
      if(t.justMerged){
        t.justMerged=false;
        updateTileVisual(t.innerEl,t.value);
        t.innerEl.classList.remove('pop-merge'); void t.innerEl.offsetWidth;
        t.innerEl.classList.add('pop-merge');
      }
    });
    addRandomTile();
    animating=false;
    if(!cellsAvailable() && !movesAvailable())endGame(false);
    checkWin();
  },SLIDE_MS);
}
function checkWin(){
  if(won)return;
  for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(tileGrid[r][c] && tileGrid[r][c].value>=2048){won=true;endGame(true)}
}
function endGame(isWin){
  over=true;
  overlayMsg.textContent = isWin ? '2048! You win' : 'Game over';
  overlay.classList.add('show');
  document.getElementById('overlayBtn').textContent = isWin ? 'Keep playing' : 'Try again';
  submitScore();
}
function submitScore(){
  leaderboard.push({name:'Guest',score,date:Date.now()});
  leaderboard.sort((a,b)=>b.score-a.score);
  leaderboard=leaderboard.slice(0,10);
  saveJSON(LB_KEY,leaderboard);
  renderLeaderboard();
}
function renderLeaderboard(){
  const el=document.getElementById('lbList');
  if(!leaderboard.length){el.innerHTML='<div class="lb-empty">No games finished yet — play one to take the top spot.</div>';return}
  el.innerHTML=leaderboard.map((row,i)=>`<div class="lb-row"><div class="lb-rank">${i+1}</div><div class="lb-name">${escapeHtml(row.name)}</div><div class="lb-score">${row.score}</div></div>`).join('');
}
function updateHud(){
  document.getElementById('score').textContent=score;
  document.getElementById('best').textContent=best;
}
function newGame(){
  tilesEl.innerHTML='';
  tileGrid=Array.from({length:SIZE},()=>Array(SIZE).fill(null));
  tiles=[]; score=0; over=false; won=false; animating=false;
  overlay.classList.remove('show');
  cellSize();
  addRandomTile(); addRandomTile();
  updateHud();
}
document.getElementById('overlayBtn').onclick=()=>{
  if(overlayMsg.textContent.startsWith('2048')){over=false;overlay.classList.remove('show')}else{newGame()}
};
document.getElementById('newGameBtn').onclick=newGame;

// keyboard
window.addEventListener('keydown',e=>{
  const map={ArrowLeft:0,ArrowUp:1,ArrowRight:2,ArrowDown:3};
  if(map[e.key]!==undefined){e.preventDefault();move(map[e.key])}
});

// pointer-based swipe (mouse drag + touch, unified)
let pStartX=0,pStartY=0,pActive=false;
boardWrap.addEventListener('pointerdown',e=>{pActive=true;pStartX=e.clientX;pStartY=e.clientY});
boardWrap.addEventListener('pointerup',e=>{
  if(!pActive)return; pActive=false;
  const dx=e.clientX-pStartX, dy=e.clientY-pStartY;
  if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;
  if(Math.abs(dx)>Math.abs(dy))move(dx>0?2:0); else move(dy>0?3:1);
});
boardWrap.addEventListener('pointercancel',()=>{pActive=false});
boardWrap.addEventListener('pointerleave',()=>{pActive=false});

// resize: reposition instantly without transition
window.addEventListener('resize',()=>{
  cellSize();
  tiles.forEach(t=>{t.el.classList.add('no-anim');positionEl(t.el,t.row,t.col)});
  requestAnimationFrame(()=>tiles.forEach(t=>t.el.classList.remove('no-anim')));
});

// ---------- init ----------
buildStaticGrid();
renderLeaderboard();
newGame();
