import{r as _,a as z,j as r}from"./index-vae0ylEK.js";const b=Math.fround,A="wb",M="wt",U="wa",$="nwa",y={_SIZE:"size",_BLOCK_SIZE:"blockSize",_ASSOC:"assoc",_HIT_TIME:"hitTime",_WRITE_HIT:"writeHit",_WRITE_MISS:"writeMiss"};function P(s){const t={L1:{},L2:{}};let n;for(const i of s.split(/\r?\n/)){const e=i.trim();if(!e)continue;const x=e.indexOf("="),l=e.indexOf("_");if(x<2||l<0)throw new Error(`Malformed config input: ${e}`);const W=e.slice(0,l),d=e.slice(l,x),h=e.slice(x+1);if(!h)throw new Error(`Missing value in config line: ${e}`);if(W==="MEMORY")n=parseInt(h,10);else if(t[W]&&y[d])t[W][y[d]]=h;else throw new Error(`Invalid configuration key: ${e}`)}const a={};for(const i of["L1","L2"]){const e=t[i];if(Object.keys(y).some(x=>e[y[x]]===void 0))throw new Error(`Incomplete cache configuration for ${i}`);if(![A,M].includes(e.writeHit))throw new Error(`Invalid write hit policy ${e.writeHit}`);if(![U,$].includes(e.writeMiss))throw new Error(`Invalid write miss policy ${e.writeMiss}`);a[i]={size:parseInt(e.size,10),blockSize:parseInt(e.blockSize,10),assoc:parseInt(e.assoc,10),hitTime:parseInt(e.hitTime,10),writeHit:e.writeHit,writeMiss:e.writeMiss}}if(n===void 0||Number.isNaN(n))throw new Error("Missing MEMORY_ACCESS_TIME");return{l1:a.L1,l2:a.L2,memoryAccessTime:n}}function D(s){const t=[];for(const n of s.split(/\r?\n/)){const a=n.trim().split(/\s+/).filter(Boolean);if(a.length!==2)continue;const[i,e]=a;if(i!=="R"&&i!=="W")continue;const x=parseInt(e,16);Number.isNaN(x)||t.push({directive:i,address:x>>>0})}return t}class j{constructor(t){if(this.cfg=t,this.numSets=Math.floor(t.size/t.blockSize/t.assoc),this.numSets<1)throw new Error("Cache must have at least one set");this.assoc=t.assoc;const n=this.numSets*this.assoc;this.tags=new Uint32Array(n),this.valid=new Uint8Array(n),this.dirty=new Uint8Array(n),this.lru=new Int32Array(n),this.offsetBits=Math.log2(t.blockSize)|0,this.indexBits=Math.log2(this.numSets)|0}getIndex(t){const n=this.indexBits===0?0:(1<<this.indexBits)-1;return t>>>this.offsetBits&n}getTag(t){const n=this.indexBits+this.offsetBits;return n>=32?0:t>>>n}updateLRU(t,n){for(let a=0;a<this.assoc;a++)this.lru[t+a]++;this.lru[t+n]=0}load(t,n){this.valid[t]=1,this.tags[t]=n,this.dirty[t]=0}dirtyBlock(t){const n=this.getIndex(t),a=this.getTag(t),i=n*this.assoc;for(let e=0;e<this.assoc;e++)if(this.valid[i+e]&&this.tags[i+e]===a)return this.dirty[i+e]=1,{set:n,way:e};return null}lookUp(t,n){const a=this.getIndex(n),i=this.getTag(n),e=a*this.assoc,x=t==="W";let l=0;for(let R=0;R<this.assoc;R++){if(this.valid[e+R]&&this.tags[e+R]===i)return x&&this.cfg.writeHit===A&&(this.dirty[e+R]=1),this.updateLRU(e,R),{hit:!0,set:a,tag:i,way:R,writeback:!1,victimAddress:0,evicted:!1,bypass:!1};this.lru[e+R]>this.lru[e+l]&&(l=R)}const W=e+l,d=this.dirty[W]===1,h=this.valid[W]===1,w=this.indexBits+this.offsetBits,m=((w>=32?0:this.tags[W]<<w)|a<<this.offsetBits)>>>0,c=x&&this.cfg.writeMiss===$;return c||(this.load(W,i),x&&this.cfg.writeHit===A&&(this.dirty[W]=1),this.updateLRU(e,l)),{hit:!1,set:a,tag:i,way:c?-1:l,writeback:d,victimAddress:m,evicted:!c&&h,bypass:c}}snapshot(){return{tags:this.tags.slice(),valid:this.valid.slice(),dirty:this.dirty.slice()}}}const T=()=>({totalAccesses:0,reads:0,writes:0,hits:0,misses:0,writebacks:0,writesToNextLevel:0});function N(s){return{sets:Math.floor(s.size/s.blockSize/s.assoc),ways:s.assoc}}function Y(s,t,n){const a=t.totalAccesses>0?b(t.misses/t.totalAccesses):0,i=b(1-a),e=n.totalAccesses>0?b(n.misses/n.totalAccesses):0,x=b(1-e),l=b(s.memoryAccessTime),W=b(s.l2.hitTime+b(e*l)),d=b(s.l1.hitTime+b(a*W));return{l1MissRate:a,l1HitRate:i,l2MissRate:e,l2HitRate:x,l1HitPercent:b(i*100),l2HitPercent:b(x*100),amat:d}}function E(s){const t=s*100,n=Math.floor(t),a=t-n;let i;a===.5?i=n%2===0?n:n+1:i=Math.round(t);const e=i<0?"-":"";return i=Math.abs(i),`${e}${Math.floor(i/100)}.${String(i%100).padStart(2,"0")}`}function q(s,t){const n=P(s),a=D(t),i=new j(n.l1),e=new j(n.l2),x=T(),l=T(),W=[];for(let d=0;d<a.length;d++){const{directive:h,address:w}=a[d],m=h==="R",c=i.lookUp(h,w);x.totalAccesses++,c.hit?x.hits++:x.misses++,m?x.reads++:x.writes++;let R=null;c.writeback&&(x.writebacks++,R=e.dirtyBlock(c.victimAddress)),c.hit&&!m&&n.l1.writeHit===M&&x.writesToNextLevel++;let p=null;c.hit||(p=e.lookUp(h,w),l.totalAccesses++,p.hit?l.hits++:l.misses++,m?l.reads++:l.writes++,p.writeback&&l.writebacks++,p.hit&&!m&&n.l2.writeHit===M&&l.writesToNextLevel++),W.push({index:d,directive:h,address:w,l1:c,l2:p,writebackTarget:R,stats:{l1:{...x},l2:{...l}},snapshot:{l1:i.snapshot(),l2:e.snapshot()}})}return{config:n,instructions:a,frames:W,geometry:{l1:N(n.l1),l2:N(n.l2)},final:{l1:x,l2:l}}}function G(s){const t=n=>({tags:new Uint32Array(n.sets*n.ways),valid:new Uint8Array(n.sets*n.ways),dirty:new Uint8Array(n.sets*n.ways)});return{l1:t(s.geometry.l1),l2:t(s.geometry.l2),stats:{l1:T(),l2:T()}}}const V=`L1_SIZE=1024\r
L1_BLOCK_SIZE=32\r
L1_ASSOC=4\r
L1_WRITE_HIT=wb\r
L1_WRITE_MISS=wa\r
L1_HIT_TIME=1\r
L2_SIZE=8192\r
L2_BLOCK_SIZE=64\r
L2_ASSOC=8\r
L2_WRITE_HIT=wb\r
L2_WRITE_MISS=wa\r
L2_HIT_TIME=10\r
MEMORY_ACCESS_TIME=100`,F=`L1_SIZE=1024\r
L1_BLOCK_SIZE=32\r
L1_ASSOC=1\r
L1_WRITE_HIT=wb\r
L1_WRITE_MISS=wa\r
L1_HIT_TIME=1\r
L2_SIZE=8192\r
L2_BLOCK_SIZE=64\r
L2_ASSOC=1\r
L2_WRITE_HIT=wb\r
L2_WRITE_MISS=wa\r
L2_HIT_TIME=10\r
MEMORY_ACCESS_TIME=100`,J=`L1_SIZE=1024\r
L1_BLOCK_SIZE=64\r
L1_ASSOC=4\r
L1_WRITE_HIT=wb\r
L1_WRITE_MISS=wa\r
L1_HIT_TIME=1\r
L2_SIZE=8192\r
L2_BLOCK_SIZE=128\r
L2_ASSOC=8\r
L2_WRITE_HIT=wb\r
L2_WRITE_MISS=wa\r
L2_HIT_TIME=10\r
MEMORY_ACCESS_TIME=100`,Q=`L1_SIZE=1024\r
L1_BLOCK_SIZE=512\r
L1_ASSOC=2\r
L1_WRITE_HIT=wb\r
L1_WRITE_MISS=wa\r
L1_HIT_TIME=1\r
L2_SIZE=8192\r
L2_BLOCK_SIZE=1024\r
L2_ASSOC=8\r
L2_WRITE_HIT=wb\r
L2_WRITE_MISS=wa\r
L2_HIT_TIME=10\r
MEMORY_ACCESS_TIME=100`,X=`L1_SIZE=4096\r
L1_BLOCK_SIZE=32\r
L1_ASSOC=4\r
L1_WRITE_HIT=wt\r
L1_WRITE_MISS=nwa\r
L1_HIT_TIME=1\r
L2_SIZE=8192\r
L2_BLOCK_SIZE=32\r
L2_ASSOC=8\r
L2_WRITE_HIT=wt\r
L2_WRITE_MISS=nwa\r
L2_HIT_TIME=10\r
MEMORY_ACCESS_TIME=100`,r0=`L1_SIZE=4096\r
L1_BLOCK_SIZE=32\r
L1_ASSOC=4\r
L1_WRITE_HIT=wt\r
L1_WRITE_MISS=wa\r
L1_HIT_TIME=1\r
L2_SIZE=8192\r
L2_BLOCK_SIZE=32\r
L2_ASSOC=8\r
L2_WRITE_HIT=wb\r
L2_WRITE_MISS=wa\r
L2_HIT_TIME=10\r
MEMORY_ACCESS_TIME=100`,n0=`L1_SIZE=128\r
L1_BLOCK_SIZE=16\r
L1_ASSOC=4\r
L1_WRITE_HIT=wb\r
L1_WRITE_MISS=wa\r
L1_HIT_TIME=1\r
L2_SIZE=512\r
L2_BLOCK_SIZE=16\r
L2_ASSOC=4\r
L2_WRITE_HIT=wb\r
L2_WRITE_MISS=wa\r
L2_HIT_TIME=10\r
MEMORY_ACCESS_TIME=100`,e0=`L1_SIZE=1024\r
L1_BLOCK_SIZE=16\r
L1_ASSOC=4\r
L1_WRITE_HIT=wb\r
L1_WRITE_MISS=wa\r
L1_HIT_TIME=1\r
L2_SIZE=4096\r
L2_BLOCK_SIZE=32\r
L2_ASSOC=8\r
L2_WRITE_HIT=wb\r
L2_WRITE_MISS=wa\r
L2_HIT_TIME=10\r
MEMORY_ACCESS_TIME=100`,t0=`R 0x00000000\r
W 0x00000020\r
R 0x00000040\r
W 0x00000060\r
R 0x00000080\r
W 0x000000A0\r
R 0x000000C0\r
W 0x000000E0\r
R 0x00000100\r
W 0x00000120\r
R 0x00000140\r
W 0x00000160\r
R 0x00000180\r
W 0x000001A0\r
R 0x000001C0\r
W 0x000001E0\r
R 0x00000200\r
W 0x00000220\r
R 0x00000240\r
W 0x00000260\r
R 0x00000280\r
W 0x000002A0\r
R 0x000002C0\r
W 0x000002E0\r
R 0x00000300\r
W 0x00000320\r
R 0x00000340\r
W 0x00000360\r
R 0x00000380\r
W 0x000003A0\r
R 0x000003C0\r
W 0x000003E0\r
R 0x00000400\r
W 0x00000420\r
R 0x00000440\r
W 0x00000460\r
R 0x00000480\r
W 0x000004A0\r
R 0x000004C0\r
W 0x000004E0\r
R 0x00000000\r
W 0x00000020\r
R 0x00000040\r
W 0x00000060\r
R 0x00000080\r
W 0x000000A0\r
R 0x000000C0\r
W 0x000000E0\r
R 0x00000100\r
W 0x00000120\r
R 0x00000140\r
W 0x00000160\r
R 0x00000180\r
W 0x000001A0\r
R 0x000001C0\r
W 0x000001E0\r
R 0x00000200\r
W 0x00000220\r
R 0x00000240\r
W 0x00000260\r
R 0x00000280\r
W 0x000002A0\r
R 0x000002C0\r
W 0x000002E0\r
R 0x00000300\r
W 0x00000320\r
R 0x00000340\r
W 0x00000360\r
R 0x00000380\r
W 0x000003A0\r
R 0x000003C0\r
W 0x000003E0\r
R 0x00000400\r
W 0x00000420\r
R 0x00000440\r
W 0x00000460\r
R 0x00000480\r
W 0x000004A0\r
R 0x000004C0\r
W 0x000004E0\r
R 0x00000000\r
W 0x00000020\r
R 0x00000040\r
W 0x00000060\r
R 0x00000080\r
W 0x000000A0\r
R 0x000000C0\r
W 0x000000E0\r
R 0x00000100\r
W 0x00000120\r
R 0x00000140\r
W 0x00000160\r
R 0x00000180\r
W 0x000001A0\r
R 0x000001C0\r
W 0x000001E0\r
R 0x00000200\r
W 0x00000220\r
R 0x00000240\r
W 0x00000260\r
R 0x00000280\r
W 0x000002A0\r
R 0x000002C0\r
W 0x000002E0\r
R 0x00000300\r
W 0x00000320\r
R 0x00000340\r
W 0x00000360\r
R 0x00000380\r
W 0x000003A0\r
R 0x000003C0\r
W 0x000003E0\r
R 0x00000400\r
W 0x00000420\r
R 0x00000440\r
W 0x00000460\r
R 0x00000480\r
W 0x000004A0\r
R 0x000004C0\r
W 0x000004E0\r
R 0x00000000\r
W 0x00000020\r
R 0x00000040\r
W 0x00000060\r
R 0x00000080\r
W 0x000000A0\r
R 0x000000C0\r
W 0x000000E0\r
R 0x00000100\r
W 0x00000120\r
R 0x00000140\r
W 0x00000160\r
R 0x00000180\r
W 0x000001A0\r
R 0x000001C0\r
W 0x000001E0\r
R 0x00000200\r
W 0x00000220\r
R 0x00000240\r
W 0x00000260\r
R 0x00000280\r
W 0x000002A0\r
R 0x000002C0\r
W 0x000002E0\r
R 0x00000300\r
W 0x00000320\r
R 0x00000340\r
W 0x00000360\r
R 0x00000380\r
W 0x000003A0\r
R 0x000003C0\r
W 0x000003E0\r
R 0x00000400\r
W 0x00000420\r
R 0x00000440\r
W 0x00000460\r
R 0x00000480\r
W 0x000004A0\r
R 0x000004C0\r
W 0x000004E0\r
R 0x00000000\r
W 0x00000020\r
R 0x00000040\r
W 0x00000060\r
R 0x00000080\r
W 0x000000A0\r
R 0x000000C0\r
W 0x000000E0\r
R 0x00000100\r
W 0x00000120\r
R 0x00000140\r
W 0x00000160\r
R 0x00000180\r
W 0x000001A0\r
R 0x000001C0\r
W 0x000001E0\r
R 0x00000200\r
W 0x00000220\r
R 0x00000240\r
W 0x00000260\r
R 0x00000280\r
W 0x000002A0\r
R 0x000002C0\r
W 0x000002E0\r
R 0x00000300\r
W 0x00000320\r
R 0x00000340\r
W 0x00000360\r
R 0x00000380\r
W 0x000003A0\r
R 0x000003C0\r
W 0x000003E0\r
R 0x00000400\r
W 0x00000420\r
R 0x00000440\r
W 0x00000460\r
R 0x00000480\r
W 0x000004A0\r
R 0x000004C0\r
W 0x000004E0\r
R 0x00000000\r
W 0x00000020\r
R 0x00000040\r
W 0x00000060\r
R 0x00000080\r
W 0x000000A0\r
R 0x000000C0\r
W 0x000000E0\r
R 0x00000100\r
W 0x00000120\r
R 0x00000140\r
W 0x00000160\r
R 0x00000180\r
W 0x000001A0\r
R 0x000001C0\r
W 0x000001E0\r
R 0x00000200\r
W 0x00000220\r
R 0x00000240\r
W 0x00000260\r
R 0x00000280\r
W 0x000002A0\r
R 0x000002C0\r
W 0x000002E0\r
R 0x00000300\r
W 0x00000320\r
R 0x00000340\r
W 0x00000360\r
R 0x00000380\r
W 0x000003A0\r
R 0x000003C0\r
W 0x000003E0\r
R 0x00000400\r
W 0x00000420\r
R 0x00000440\r
W 0x00000460\r
R 0x00000480\r
W 0x000004A0\r
R 0x000004C0\r
W 0x000004E0\r
R 0x00000000\r
W 0x00000020\r
R 0x00000040\r
W 0x00000060\r
R 0x00000080\r
W 0x000000A0\r
R 0x000000C0\r
W 0x000000E0\r
R 0x00000100\r
W 0x00000120\r
R 0x00000140\r
W 0x00000160\r
R 0x00000180\r
W 0x000001A0\r
R 0x000001C0\r
W 0x000001E0\r
R 0x00000200\r
W 0x00000220\r
R 0x00000240\r
W 0x00000260\r
R 0x00000280\r
W 0x000002A0\r
R 0x000002C0\r
W 0x000002E0\r
R 0x00000300\r
W 0x00000320\r
R 0x00000340\r
W 0x00000360\r
R 0x00000380\r
W 0x000003A0\r
R 0x000003C0\r
W 0x000003E0\r
R 0x00000400\r
W 0x00000420\r
R 0x00000440\r
W 0x00000460\r
R 0x00000480\r
W 0x000004A0\r
R 0x000004C0\r
W 0x000004E0\r
R 0x00000000\r
W 0x00000020\r
R 0x00000040\r
W 0x00000060\r
R 0x00000080\r
W 0x000000A0\r
R 0x000000C0\r
W 0x000000E0\r
R 0x00000100\r
W 0x00000120\r
R 0x00000140\r
W 0x00000160\r
R 0x00000180\r
W 0x000001A0\r
R 0x000001C0\r
W 0x000001E0\r
R 0x00000200\r
W 0x00000220\r
R 0x00000240\r
W 0x00000260\r
R 0x00000280\r
W 0x000002A0\r
R 0x000002C0\r
W 0x000002E0\r
R 0x00000300\r
W 0x00000320\r
R 0x00000340\r
W 0x00000360\r
R 0x00000380\r
W 0x000003A0\r
R 0x000003C0\r
W 0x000003E0\r
R 0x00000400\r
W 0x00000420\r
R 0x00000440\r
W 0x00000460\r
R 0x00000480\r
W 0x000004A0\r
R 0x000004C0\r
W 0x000004E0\r
`,s0=`R 0x00000000\r
R 0x00000020\r
R 0x00000040\r
R 0x00000060\r
R 0x00000080\r
R 0x000000A0\r
R 0x000000C0\r
R 0x000000E0\r
R 0x00000100\r
R 0x00000120\r
R 0x00000140\r
R 0x00000160\r
R 0x00000180\r
R 0x000001A0\r
R 0x000001C0\r
R 0x000001E0\r
R 0x00000200\r
R 0x00000220\r
R 0x00000240\r
R 0x00000260\r
R 0x00000280\r
R 0x000002A0\r
R 0x000002C0\r
R 0x000002E0\r
R 0x00000300\r
R 0x00000320\r
R 0x00000340\r
R 0x00000360\r
R 0x00000380\r
R 0x000003A0\r
R 0x000003C0\r
R 0x000003E0\r
R 0x00000400\r
R 0x00000420\r
R 0x00000440\r
R 0x00000460\r
R 0x00000480\r
R 0x000004A0\r
R 0x000004C0\r
R 0x000004E0\r
R 0x00000000\r
R 0x00000020\r
R 0x00000040\r
R 0x00000060\r
R 0x00000080\r
R 0x000000A0\r
R 0x000000C0\r
R 0x000000E0\r
R 0x00000100\r
R 0x00000120\r
R 0x00000140\r
R 0x00000160\r
R 0x00000180\r
R 0x000001A0\r
R 0x000001C0\r
R 0x000001E0\r
R 0x00000200\r
R 0x00000220\r
R 0x00000240\r
R 0x00000260\r
R 0x00000280\r
R 0x000002A0\r
R 0x000002C0\r
R 0x000002E0\r
R 0x00000300\r
R 0x00000320\r
R 0x00000340\r
R 0x00000360\r
R 0x00000380\r
R 0x000003A0\r
R 0x000003C0\r
R 0x000003E0\r
R 0x00000400\r
R 0x00000420\r
R 0x00000440\r
R 0x00000460\r
R 0x00000480\r
R 0x000004A0\r
R 0x000004C0\r
R 0x000004E0\r
`,C=[{id:"half-sets",name:"Half the sets",tagline:"1 KB L1 that fits the working set but gets 0% hits",description:"16 sets x 4 ways holds all 40 blocks, but the 0x20 address stride only ever lands on the even sets. Those 8 sets overflow while the odd ones stay empty.",config:e0,trace:s0,documented:"61.00"},{id:"reference",name:"Reference",tagline:"4-way L1 on a looping trace",description:"8 sets x 4 ways = 32 blocks, but the loop touches 40. Each set sees 5 blocks in a repeating order, so LRU always evicts the block needed next and L1 never hits.",config:V,documented:"17.25"},{id:"one-way",name:"Direct-mapped",tagline:"1-way beats 4-way",description:"Same sizes, but 1-way means 32 L1 sets. Most blocks now get a set to themselves, so L1 starts hitting and AMAT drops.",config:F,documented:"12.00"},{id:"double-block",name:"Doubled blocks",tagline:"64 B / 128 B blocks",description:"Doubling block size lets each fetch cover two sequential addresses, turning compulsory misses into spatial-locality hits.",config:J,documented:"9.12"},{id:"huge-block",name:"Huge blocks",tagline:"512 B / 1 KB blocks",description:"Extreme block sizes: nearly the whole working set arrives in one or two fetches.",config:Q,documented:"2.38"},{id:"wt-nwa",name:"No-write-allocate",tagline:"L1 write-through + NWA",description:"Writes that miss bypass the cache entirely (dashed set outline), so later accesses to that block miss too. This caps L1 hit rate on mixed read/write workloads.",config:X,documented:"62.88"},{id:"wt-wa",name:"Write-allocate",tagline:"L1 write-through + WA",description:"Same workload with a write-allocate L1: written blocks are brought in, so repeat passes hit.",config:r0,documented:"14.75"},{id:"tiny",name:"Tiny caches",tagline:"128 B L1 / 512 B L2",description:"Caches far smaller than the working set. Every access misses both levels and pays the full memory penalty.",config:n0,documented:"111.00"}].map(s=>({trace:t0,...s})),H=[{label:"Slow",perTick:1},{label:"Medium",perTick:3},{label:"Fast",perTick:10}],i0=100,Z=(s,t=8)=>`0x${s.toString(16).toUpperCase().padStart(t,"0")}`,O=s=>`${s.writeHit==="wb"?"write-back":"write-through"} / ${s.writeMiss==="wa"?"write-allocate":"no-write-allocate"}`,a0=({valid:s,dirty:t,tag:n,hit:a,miss:i,writeback:e})=>{let x="bg-black-200 border-white/10";return s&&(x="bg-indigo-500/50 border-indigo-300/40"),a&&(x="bg-green-500 border-green-200 shadow-[0_0_8px_#22c55e]"),i&&(x="bg-red-500 border-red-200 shadow-[0_0_8px_#ef4444]"),r.jsx("div",{title:s?`tag ${Z(n,1)}${t?" (dirty)":""}`:"empty",className:`relative w-[14px] h-[14px] rounded-[3px] border transition-colors duration-150 ${x} ${e?"ring-2 ring-amber-300":""}`,children:s&&t&&r.jsx("span",{className:"absolute -top-[2px] -right-[2px] w-[6px] h-[6px] rounded-full bg-amber-300"})})},B=({title:s,subtitle:t,geo:n,data:a,access:i,writebackTarget:e})=>{const x=n.sets<=32,l=Math.min(n.ways,16);return r.jsxs("div",{className:"bg-black-100 rounded-xl p-4 border border-white/10",children:[r.jsx("h4",{className:"text-white font-bold text-[16px]",children:s}),r.jsx("p",{className:"text-secondary text-[12px] mb-3",children:t}),r.jsx("div",{className:"flex flex-wrap gap-2 max-h-[220px] overflow-y-auto pr-1",children:Array.from({length:n.sets},(W,d)=>{const h=i&&i.bypass&&i.set===d;return r.jsxs("div",{className:`rounded-md p-1 border ${h?"border-dashed border-red-400":"border-white/10"}`,children:[x&&r.jsxs("div",{className:"text-[9px] text-secondary leading-none mb-1",children:["set ",d]}),r.jsx("div",{className:"grid gap-[2px]",style:{gridTemplateColumns:`repeat(${l}, 14px)`},children:Array.from({length:n.ways},(w,m)=>{const c=d*n.ways+m,R=i&&i.set===d&&i.way===m;return r.jsx(a0,{valid:a.valid[c]===1,dirty:a.dirty[c]===1,tag:a.tags[c],hit:R&&i.hit,miss:R&&!i.hit,writeback:e&&e.set===d&&e.way===m},m)})})]},d)})})]})},x0=({stats:s,analysis:t,config:n})=>{const a=(i,e,x,l)=>r.jsxs("tr",{className:"border-t border-white/10",children:[r.jsx("td",{className:"py-2 pr-3 text-white font-semibold",children:i}),r.jsx("td",{className:"py-2 pr-3",children:e.totalAccesses}),r.jsx("td",{className:"py-2 pr-3 text-green-400",children:e.hits}),r.jsx("td",{className:"py-2 pr-3 text-red-400",children:e.misses}),r.jsx("td",{className:"py-2 pr-3",children:e.totalAccesses?`${E(x)}%`:"-"}),r.jsx("td",{className:"py-2",title:l,children:e.writebacks})]});return r.jsxs("div",{className:"bg-black-100 rounded-xl p-4 border border-white/10 overflow-x-auto",children:[r.jsxs("table",{className:"w-full text-left text-[13px] text-secondary",children:[r.jsx("thead",{children:r.jsxs("tr",{className:"text-[11px] uppercase tracking-wider",children:[r.jsx("th",{className:"pb-2 pr-3 font-medium",children:"Level"}),r.jsx("th",{className:"pb-2 pr-3 font-medium",children:"Accesses"}),r.jsx("th",{className:"pb-2 pr-3 font-medium",children:"Hits"}),r.jsx("th",{className:"pb-2 pr-3 font-medium",children:"Misses"}),r.jsx("th",{className:"pb-2 pr-3 font-medium",children:"Hit rate"}),r.jsx("th",{className:"pb-2 font-medium",children:"Writebacks"})]})}),r.jsxs("tbody",{children:[a("L1",s.l1,t.l1HitPercent,"Dirty blocks written back to L2"),a("L2",s.l2,t.l2HitPercent,"Dirty blocks written back to memory")]})]}),r.jsxs("p",{className:"mt-3 text-[13px] text-secondary font-mono break-words",children:["AMAT = ",n.l1.hitTime," + ",E(t.l1MissRate)," × (",n.l2.hitTime," + ",E(t.l2MissRate)," ×"," ",n.memoryAccessTime,") = ",r.jsxs("span",{className:"text-white font-bold",children:[E(t.amat)," cycles"]})]})]})},o0=s=>{if(!s)return"Press play or step to begin.";const t=a=>`set ${a.set}${a.way>=0?`, way ${a.way}`:""}`;let n=`#${s.index+1}  ${s.directive==="R"?"Read":"Write"} ${Z(s.address)} → L1 ${s.l1.hit?"hit":"miss"} (${t(s.l1)})`;return s.l2&&(n+=` → L2 ${s.l2.hit?"hit":"miss"} (${t(s.l2)})`,s.l2.hit||(n+=" → memory")),s.l1.bypass&&(n+=". L1 write bypassed (no-write-allocate)"),s.l1.writeback&&(n+=". Dirty L1 victim written back to L2"),n},c0=({onClose:s})=>{const[t,n]=_.useState(C[0].id),[a,i]=_.useState(0),[e,x]=_.useState(!0),[l,W]=_.useState(1),d=_.useRef(null),h=C.find(o=>o.id===t),w=_.useMemo(()=>q(h.config,h.trace),[h]),m=w.frames.length,c=a>0?w.frames[a-1]:null,R=c?{...c.snapshot,stats:c.stats}:G(w),p=Y(w.config,R.stats.l1,R.stats.l2),u=a===m,K=_.useCallback(o=>{n(o),i(0),x(!0)},[]);_.useEffect(()=>{if(!e)return;const o=setInterval(()=>{i(I=>Math.min(m,I+H[l].perTick))},i0);return()=>clearInterval(o)},[e,l,m]),_.useEffect(()=>{u&&x(!1)},[u]),_.useEffect(()=>{var v;const o=document.activeElement,I=document.body.style.overflow;document.body.style.overflow="hidden",(v=d.current)==null||v.focus();const k=g=>{g.key==="Escape"&&s()};return window.addEventListener("keydown",k),()=>{var g;window.removeEventListener("keydown",k),document.body.style.overflow=I,(g=o==null?void 0:o.focus)==null||g.call(o)}},[s]);const f="px-3 py-1.5 rounded-lg text-[13px] font-medium border border-white/20 text-white hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent",{l1:L,l2:S}=w.config;return z.createPortal(r.jsx("div",{className:"fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-6",onMouseDown:o=>o.target===o.currentTarget&&s(),children:r.jsxs("div",{role:"dialog","aria-modal":"true","aria-labelledby":"cache-demo-title",className:"bg-tertiary w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-2xl p-4 sm:p-6 shadow-card",children:[r.jsxs("div",{className:"flex items-start justify-between gap-4",children:[r.jsxs("div",{children:[r.jsx("h3",{id:"cache-demo-title",className:"text-white font-bold text-[24px]",children:"Cache Hierarchy Emulator"}),r.jsxs("p",{className:"text-secondary text-[13px]",children:["In-browser port of my C++ two-level simulator, replaying a ",m,"-access read/write trace."]})]}),r.jsx("button",{ref:d,onClick:s,"aria-label":"Close demo",className:f,children:"Close"})]}),r.jsx("div",{className:"mt-4 flex flex-wrap gap-2",role:"tablist","aria-label":"Presets",children:C.map(o=>r.jsx("button",{role:"tab","aria-selected":o.id===t,onClick:()=>K(o.id),className:`px-3 py-1.5 rounded-lg text-[13px] border ${o.id===t?"bg-[#915eff] border-[#915eff] text-white":"border-white/20 text-secondary hover:text-white hover:bg-white/10"}`,children:o.name},o.id))}),r.jsxs("p",{className:"mt-3 text-[14px] text-white-100",children:[r.jsxs("span",{className:"font-bold",children:[h.tagline,"."]})," ",r.jsx("span",{className:"text-secondary",children:h.description})]}),r.jsxs("div",{className:"mt-4 flex flex-wrap items-center gap-2",children:[r.jsx("button",{className:f,onClick:()=>{u&&i(0),x(o=>u?!0:!o)},children:u?"Replay":e?"Pause":"Play"}),r.jsx("button",{className:f,disabled:u,onClick:()=>{x(!1),i(o=>Math.min(m,o+1))},children:"Step"}),r.jsx("button",{className:f,disabled:a===0,onClick:()=>{x(!1),i(0)},children:"Reset"}),r.jsx("button",{className:f,disabled:u,onClick:()=>{x(!1),i(m)},children:"Skip to end"}),r.jsxs("label",{className:"text-[13px] text-secondary flex items-center gap-2 ml-auto",children:["Speed",r.jsx("select",{value:l,onChange:o=>W(Number(o.target.value)),className:"bg-black-200 text-white rounded-md px-2 py-1 border border-white/20",children:H.map((o,I)=>r.jsx("option",{value:I,children:o.label},o.label))})]})]}),r.jsx("input",{type:"range",min:0,max:m,value:a,onChange:o=>{x(!1),i(Number(o.target.value))},"aria-label":"Trace position",className:"mt-3 w-full accent-[#915eff]"}),r.jsx("p",{className:"mt-1 text-[13px] text-white font-mono min-h-[20px]","aria-live":"polite",children:o0(c)}),r.jsxs("div",{className:"mt-4 grid lg:grid-cols-2 gap-4",children:[r.jsx(B,{title:"L1",subtitle:`${L.size} B · ${L.blockSize} B blocks · ${L.assoc}-way · ${w.geometry.l1.sets} sets · ${O(L)}`,geo:w.geometry.l1,data:R.l1,access:c==null?void 0:c.l1}),r.jsx(B,{title:"L2",subtitle:`${S.size} B · ${S.blockSize} B blocks · ${S.assoc}-way · ${w.geometry.l2.sets} sets · ${O(S)}`,geo:w.geometry.l2,data:R.l2,access:c==null?void 0:c.l2,writebackTarget:c==null?void 0:c.writebackTarget})]}),r.jsxs("div",{className:"mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-secondary",children:[r.jsxs("span",{children:[r.jsx("i",{className:"inline-block w-3 h-3 rounded-[3px] bg-green-500 align-middle"})," hit"]}),r.jsxs("span",{children:[r.jsx("i",{className:"inline-block w-3 h-3 rounded-[3px] bg-red-500 align-middle"})," miss (block loaded)"]}),r.jsxs("span",{children:[r.jsx("i",{className:"inline-block w-3 h-3 rounded-[3px] bg-indigo-500/50 border border-indigo-300/40 align-middle"})," valid"]}),r.jsxs("span",{children:[r.jsx("i",{className:"inline-block w-3 h-3 rounded-[3px] bg-black-200 border border-white/10 align-middle"})," empty"]}),r.jsxs("span",{children:[r.jsx("i",{className:"inline-block w-2 h-2 rounded-full bg-amber-300 align-middle"})," dirty"]}),r.jsxs("span",{children:[r.jsx("i",{className:"inline-block w-3 h-3 rounded-[3px] border border-dashed border-red-400 align-middle"})," write bypassed set"]})]}),r.jsxs("div",{className:"mt-4",children:[r.jsx(x0,{stats:R.stats,analysis:p,config:w.config}),r.jsx("p",{className:"mt-2 text-[12px] text-secondary",children:u?E(p.amat)===h.documented?r.jsxs("span",{className:"text-green-400",children:["✓ Final AMAT ",E(p.amat)," matches the value documented in the repo write-up and the C++ simulator output."]}):r.jsxs("span",{className:"text-amber-300",children:["Final AMAT ",E(p.amat)," (documented: ",h.documented,")."]}):`Running totals after ${a} of ${m} accesses.`})]})]})}),document.body)};export{c0 as default};
