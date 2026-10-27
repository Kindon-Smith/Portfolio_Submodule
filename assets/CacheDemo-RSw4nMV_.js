import{r as R,a as r0,j as e}from"./index-MJMOhriX.js";const f=Math.fround,Y="wb",F="wt",n0="wa",t0="nwa",$={_SIZE:"size",_BLOCK_SIZE:"blockSize",_ASSOC:"assoc",_HIT_TIME:"hitTime",_WRITE_HIT:"writeHit",_WRITE_MISS:"writeMiss"};function a0(t){const s={L1:{},L2:{}};let r;for(const i of t.split(/\r?\n/)){const n=i.trim();if(!n)continue;const a=n.indexOf("="),c=n.indexOf("_");if(a<2||c<0)throw new Error(`Malformed config input: ${n}`);const p=n.slice(0,c),x=n.slice(c,a),d=n.slice(a+1);if(!d)throw new Error(`Missing value in config line: ${n}`);if(p==="MEMORY")r=parseInt(d,10);else if(s[p]&&$[x])s[p][$[x]]=d;else throw new Error(`Invalid configuration key: ${n}`)}const o={};for(const i of["L1","L2"]){const n=s[i];if(Object.keys($).some(a=>n[$[a]]===void 0))throw new Error(`Incomplete cache configuration for ${i}`);if(![Y,F].includes(n.writeHit))throw new Error(`Invalid write hit policy ${n.writeHit}`);if(![n0,t0].includes(n.writeMiss))throw new Error(`Invalid write miss policy ${n.writeMiss}`);o[i]={size:parseInt(n.size,10),blockSize:parseInt(n.blockSize,10),assoc:parseInt(n.assoc,10),hitTime:parseInt(n.hitTime,10),writeHit:n.writeHit,writeMiss:n.writeMiss}}if(r===void 0||Number.isNaN(r))throw new Error("Missing MEMORY_ACCESS_TIME");return{l1:o.L1,l2:o.L2,memoryAccessTime:r}}function i0(t){const s=[];for(const r of t.split(/\r?\n/)){const o=r.trim().split(/\s+/).filter(Boolean);if(o.length!==2)continue;const[i,n]=o;if(i!=="R"&&i!=="W")continue;const a=parseInt(n,16);Number.isNaN(a)||s.push({directive:i,address:a>>>0})}return s}class G{constructor(s){if(this.cfg=s,this.numSets=Math.floor(s.size/s.blockSize/s.assoc),this.numSets<1)throw new Error("Cache must have at least one set");this.assoc=s.assoc;const r=this.numSets*this.assoc;this.tags=new Uint32Array(r),this.valid=new Uint8Array(r),this.dirty=new Uint8Array(r),this.lru=new Int32Array(r),this.offsetBits=Math.log2(s.blockSize)|0,this.indexBits=Math.log2(this.numSets)|0}getIndex(s){const r=this.indexBits===0?0:(1<<this.indexBits)-1;return s>>>this.offsetBits&r}getTag(s){const r=this.indexBits+this.offsetBits;return r>=32?0:s>>>r}updateLRU(s,r){for(let o=0;o<this.assoc;o++)this.lru[s+o]++;this.lru[s+r]=0}load(s,r){this.valid[s]=1,this.tags[s]=r,this.dirty[s]=0}dirtyBlock(s){const r=this.getIndex(s),o=this.getTag(s),i=r*this.assoc;for(let n=0;n<this.assoc;n++)if(this.valid[i+n]&&this.tags[i+n]===o)return this.dirty[i+n]=1,{set:r,way:n};return null}lookUp(s,r){const o=this.getIndex(r),i=this.getTag(r),n=o*this.assoc,a=s==="W";let c=0;for(let w=0;w<this.assoc;w++){if(this.valid[n+w]&&this.tags[n+w]===i)return a&&this.cfg.writeHit===Y&&(this.dirty[n+w]=1),this.updateLRU(n,w),{hit:!0,set:o,tag:i,way:w,writeback:!1,victimAddress:0,evicted:!1,bypass:!1};this.lru[n+w]>this.lru[n+c]&&(c=w)}const p=n+c,x=this.dirty[p]===1,d=this.valid[p]===1,u=this.indexBits+this.offsetBits,h=((u>=32?0:this.tags[p]<<u)|o<<this.offsetBits)>>>0,m=a&&this.cfg.writeMiss===t0;return m||(this.load(p,i),a&&this.cfg.writeHit===Y&&(this.dirty[p]=1),this.updateLRU(n,c)),{hit:!1,set:o,tag:i,way:m?-1:c,writeback:x,victimAddress:h,evicted:!m&&d,bypass:m}}snapshot(){return{tags:this.tags.slice(),valid:this.valid.slice(),dirty:this.dirty.slice()}}}const z=()=>({totalAccesses:0,reads:0,writes:0,hits:0,misses:0,writebacks:0,writesToNextLevel:0});function q(t){return{sets:Math.floor(t.size/t.blockSize/t.assoc),ways:t.assoc}}function o0(t,s,r){const o=s.totalAccesses>0?f(s.misses/s.totalAccesses):0,i=f(1-o),n=r.totalAccesses>0?f(r.misses/r.totalAccesses):0,a=f(1-n),c=f(t.memoryAccessTime),p=f(t.l2.hitTime+f(n*c)),x=f(t.l1.hitTime+f(o*p));return{l1MissRate:o,l1HitRate:i,l2MissRate:n,l2HitRate:a,l1HitPercent:f(i*100),l2HitPercent:f(a*100),amat:x}}function T(t){const s=t*100,r=Math.floor(s),o=s-r;let i;o===.5?i=r%2===0?r:r+1:i=Math.round(s);const n=i<0?"-":"";return i=Math.abs(i),`${n}${Math.floor(i/100)}.${String(i%100).padStart(2,"0")}`}function l0(t,s){const r=a0(t),o=i0(s),i=new G(r.l1),n=new G(r.l2),a=z(),c=z(),p=[];for(let x=0;x<o.length;x++){const{directive:d,address:u}=o[x],h=d==="R",m=i.lookUp(d,u);a.totalAccesses++,m.hit?a.hits++:a.misses++,h?a.reads++:a.writes++;let w=null;m.writeback&&(a.writebacks++,w=n.dirtyBlock(m.victimAddress)),m.hit&&!h&&r.l1.writeHit===F&&a.writesToNextLevel++;let _=null;m.hit||(_=n.lookUp(d,u),c.totalAccesses++,_.hit?c.hits++:c.misses++,h?c.reads++:c.writes++,_.writeback&&c.writebacks++,_.hit&&!h&&r.l2.writeHit===F&&c.writesToNextLevel++),p.push({index:x,directive:d,address:u,l1:m,l2:_,writebackTarget:w,stats:{l1:{...a},l2:{...c}},snapshot:{l1:i.snapshot(),l2:n.snapshot()}})}return{config:r,instructions:o,frames:p,geometry:{l1:q(r.l1),l2:q(r.l2)},final:{l1:a,l2:c}}}function c0(t){const s=r=>({tags:new Uint32Array(r.sets*r.ways),valid:new Uint8Array(r.sets*r.ways),dirty:new Uint8Array(r.sets*r.ways)});return{l1:s(t.geometry.l1),l2:s(t.geometry.l2),stats:{l1:z(),l2:z()}}}const x0=`L1_SIZE=1024\r
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
MEMORY_ACCESS_TIME=100`,d0=`L1_SIZE=1024\r
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
MEMORY_ACCESS_TIME=100`,h0=`L1_SIZE=1024\r
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
MEMORY_ACCESS_TIME=100`,m0=`L1_SIZE=1024\r
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
MEMORY_ACCESS_TIME=100`,p0=`L1_SIZE=4096\r
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
MEMORY_ACCESS_TIME=100`,w0=`L1_SIZE=4096\r
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
MEMORY_ACCESS_TIME=100`,R0=`L1_SIZE=128\r
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
MEMORY_ACCESS_TIME=100`,b0=`L1_SIZE=1024\r
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
MEMORY_ACCESS_TIME=100`,u0=`R 0x00000000\r
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
`,f0=`R 0x00000000\r
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
`,Z=[{id:"half-sets",name:"Half the sets",tagline:"1 KB L1 that fits the working set but gets 0% hits",description:"16 sets x 4 ways holds all 40 blocks, but the 0x20 address stride only ever lands on the even sets. Those 8 sets overflow while the odd ones stay empty.",config:b0,trace:f0,documented:"61.00"},{id:"reference",name:"Reference",tagline:"4-way L1 on a looping trace",description:"8 sets x 4 ways = 32 blocks, but the loop touches 40. Each set sees 5 blocks in a repeating order, so LRU always evicts the block needed next and L1 never hits.",config:x0,documented:"17.25"},{id:"one-way",name:"Direct-mapped",tagline:"1-way beats 4-way",description:"Same sizes, but 1-way means 32 L1 sets. Most blocks now get a set to themselves, so L1 starts hitting and AMAT drops.",config:d0,documented:"12.00"},{id:"double-block",name:"Doubled blocks",tagline:"64 B / 128 B blocks",description:"Doubling block size lets each fetch cover two sequential addresses, turning compulsory misses into spatial-locality hits.",config:h0,documented:"9.12"},{id:"huge-block",name:"Huge blocks",tagline:"512 B / 1 KB blocks",description:"Extreme block sizes: nearly the whole working set arrives in one or two fetches.",config:m0,documented:"2.38"},{id:"wt-nwa",name:"No-write-allocate",tagline:"L1 write-through + NWA",description:"Writes that miss bypass the cache entirely (dashed set outline), so later accesses to that block miss too. This caps L1 hit rate on mixed read/write workloads.",config:p0,documented:"62.88"},{id:"wt-wa",name:"Write-allocate",tagline:"L1 write-through + WA",description:"Same workload with a write-allocate L1: written blocks are brought in, so repeat passes hit.",config:w0,documented:"14.75"},{id:"tiny",name:"Tiny caches",tagline:"128 B L1 / 512 B L2",description:"Caches far smaller than the working set. Every access misses both levels and pays the full memory penalty.",config:R0,documented:"111.00"}].map(t=>({trace:u0,...t})),g0=320,y0=t=>`0x${(t>>>0).toString(16).toUpperCase().padStart(8,"0")}`,W0=t=>()=>{t=t+1831565813|0;let s=Math.imul(t^t>>>15,1|t);return s=s+Math.imul(s^s>>>7,61|s)^s,((s^s>>>14)>>>0)/4294967296},W=(t,s)=>{const r=W0(t),o=[];for(let i=0;i<g0;i++){const[n,a]=s(i,r);o.push(`${n} ${y0(a)}`)}return o.join(`
`)},K=(t,s)=>Math.floor(t()*s/4)*4,U=[{id:"sequential",name:"Array walk",tagline:"Read an array front to back",description:"Reads consecutive 4-byte values. One miss loads a whole block, and the next several reads hit it for free. This is spatial locality, and bigger blocks help.",trace:W(1,t=>["R",t*4])},{id:"small-loop",name:"Small loop",tagline:"Re-read 512 B over and over",description:"A tight loop over a small array. The first pass fills the cache, then every later pass hits. This is temporal locality, the case caches are built for.",trace:W(2,t=>["R",t%128*4])},{id:"big-loop",name:"Big loop",tagline:"Re-read 8 KB, one block at a time",description:"Loops over an 8 KB array, touching one address per 64 B. A small L1 forgets each block before the loop comes back to it. A large enough L2 still remembers, so it picks up the slack.",trace:W(3,t=>["R",t*64%8192])},{id:"conflict-stride",name:"Conflict stride",tagline:"Every access lands in the same set",description:"Reads every 256 B across 8 KB. With a power-of-two stride, addresses pile into the same few sets and evict each other while the rest of the cache sits empty. Try raising associativity.",trace:W(4,t=>["R",t*256%8192])},{id:"col-major",name:"Matrix by column",tagline:"32x32 ints walked down the columns",description:"A 32x32 matrix of 4-byte ints, visited column by column. Each step jumps 128 B, so almost every access needs a new block, and blocks get evicted before the next column reuses them. Walking the same matrix row by row is just the Array walk workload: same data, very different speed.",trace:W(6,t=>["R",(t%32*32+Math.floor(t/32))*4])},{id:"random",name:"Random access",tagline:"Uniform over 4 KB, 20% writes",description:"No pattern to exploit. Hit rate depends almost entirely on how much of the 4 KB region fits in the cache.",trace:W(7,(t,s)=>[s()<.2?"W":"R",K(s,4096)])},{id:"hot-cold",name:"Hot and cold data",tagline:"80% of accesses hit a 256 B hot spot",description:"Most accesses go to a small hot region, the rest scatter across 32 KB. The hot blocks stay resident, so a small cache still does well. This is the usual shape of real programs.",trace:W(8,(t,s)=>s()<.8?["R",K(s,256)]:["R",16384+K(s,32768)])},{id:"increment",name:"Increment array",tagline:"Read then write each element",description:"For each element: read it, then write it back changed (a[i]++). Written blocks become dirty, so watch the amber dots and the writeback counts as they get evicted.",trace:W(9,t=>[t%2===0?"R":"W",Math.floor(t/2)*16])},{id:"copy",name:"Copy a buffer",tagline:"Read from one array, write to another",description:"Streams data from a source buffer into a destination buffer. Every write goes to a block never seen before, so write-allocate vs no-write-allocate makes a big difference here.",trace:W(10,t=>t%2===0?["R",Math.floor(t/2)*4]:["W",16384+Math.floor(t/2)*4])}],P={l1:{size:1024,blockSize:32,assoc:4,writeHit:"wb",writeMiss:"wa",hitTime:1},l2:{size:8192,blockSize:64,assoc:8,writeHit:"wb",writeMiss:"wa",hitTime:10},memoryAccessTime:100},_0=({l1:t,l2:s,memoryAccessTime:r})=>[["L1",t],["L2",s]].flatMap(([o,i])=>[`${o}_SIZE=${i.size}`,`${o}_BLOCK_SIZE=${i.blockSize}`,`${o}_ASSOC=${i.assoc}`,`${o}_WRITE_HIT=${i.writeHit}`,`${o}_WRITE_MISS=${i.writeMiss}`,`${o}_HIT_TIME=${i.hitTime}`]).concat(`MEMORY_ACCESS_TIME=${r}`).join(`
`),V={l1:{sizes:[128,256,512,1024,2048,4096,8192]},l2:{sizes:[512,1024,2048,4096,8192,16384,32768]}},E0=[16,32,64,128,256,512],S0=[1,2,4,8,16],I0=t=>{const s=Math.min(t.blockSize,t.size),r=Math.min(t.assoc,t.size/s);return{...t,blockSize:s,assoc:r}},L0=[{id:"presets",label:"Guided presets"},{id:"workloads",label:"Try different workloads"},{id:"custom",label:"Build your own cache"}],J=[{label:"Slow",perTick:1},{label:"Medium",perTick:3},{label:"Fast",perTick:10}],T0=100,s0=(t,s=8)=>`0x${t.toString(16).toUpperCase().padStart(s,"0")}`,Q=t=>`${t.writeHit==="wb"?"write-back":"write-through"} / ${t.writeMiss==="wa"?"write-allocate":"no-write-allocate"}`,C0=({valid:t,dirty:s,tag:r,hit:o,miss:i,writeback:n})=>{let a="bg-black-200 border-white/10";return t&&(a="bg-indigo-500/50 border-indigo-300/40"),o&&(a="bg-green-500 border-green-200 shadow-[0_0_8px_#22c55e]"),i&&(a="bg-red-500 border-red-200 shadow-[0_0_8px_#ef4444]"),e.jsx("div",{title:t?`tag ${s0(r,1)}${s?" (dirty)":""}`:"empty",className:`relative w-[14px] h-[14px] rounded-[3px] border transition-colors duration-150 ${a} ${n?"ring-2 ring-amber-300":""}`,children:t&&s&&e.jsx("span",{className:"absolute -top-[2px] -right-[2px] w-[6px] h-[6px] rounded-full bg-amber-300"})})},X=({title:t,subtitle:s,geo:r,data:o,access:i,writebackTarget:n})=>{const a=r.sets<=32,c=Math.min(r.ways,16);return e.jsxs("div",{className:"bg-black-100 rounded-xl p-4 border border-white/10",children:[e.jsx("h4",{className:"text-white font-bold text-[16px]",children:t}),e.jsx("p",{className:"text-secondary text-[12px] mb-3",children:s}),e.jsx("div",{className:"flex flex-wrap gap-2 max-h-[220px] overflow-y-auto pr-1",children:Array.from({length:r.sets},(p,x)=>{const d=i&&i.bypass&&i.set===x;return e.jsxs("div",{className:`rounded-md p-1 border ${d?"border-dashed border-red-400":"border-white/10"}`,children:[a&&e.jsxs("div",{className:"text-[9px] text-secondary leading-none mb-1",children:["set ",x]}),e.jsx("div",{className:"grid gap-[2px]",style:{gridTemplateColumns:`repeat(${c}, 14px)`},children:Array.from({length:r.ways},(u,h)=>{const m=x*r.ways+h,w=i&&i.set===x&&i.way===h;return e.jsx(C0,{valid:o.valid[m]===1,dirty:o.dirty[m]===1,tag:o.tags[m],hit:w&&i.hit,miss:w&&!i.hit,writeback:n&&n.set===x&&n.way===h},h)})})]},x)})})]})},k0=({stats:t,analysis:s,config:r})=>{const o=(i,n,a,c)=>e.jsxs("tr",{className:"border-t border-white/10",children:[e.jsx("td",{className:"py-2 pr-3 text-white font-semibold",children:i}),e.jsx("td",{className:"py-2 pr-3",children:n.totalAccesses}),e.jsx("td",{className:"py-2 pr-3 text-green-400",children:n.hits}),e.jsx("td",{className:"py-2 pr-3 text-red-400",children:n.misses}),e.jsx("td",{className:"py-2 pr-3",children:n.totalAccesses?`${T(a)}%`:"-"}),e.jsx("td",{className:"py-2",title:c,children:n.writebacks})]});return e.jsxs("div",{className:"bg-black-100 rounded-xl p-4 border border-white/10 overflow-x-auto",children:[e.jsxs("table",{className:"w-full text-left text-[13px] text-secondary",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"text-[11px] uppercase tracking-wider",children:[e.jsx("th",{className:"pb-2 pr-3 font-medium",children:"Level"}),e.jsx("th",{className:"pb-2 pr-3 font-medium",children:"Accesses"}),e.jsx("th",{className:"pb-2 pr-3 font-medium",children:"Hits"}),e.jsx("th",{className:"pb-2 pr-3 font-medium",children:"Misses"}),e.jsx("th",{className:"pb-2 pr-3 font-medium",children:"Hit rate"}),e.jsx("th",{className:"pb-2 font-medium",children:"Writebacks"})]})}),e.jsxs("tbody",{children:[o("L1",t.l1,s.l1HitPercent,"Dirty blocks written back to L2"),o("L2",t.l2,s.l2HitPercent,"Dirty blocks written back to memory")]})]}),e.jsxs("p",{className:"mt-3 text-[13px] text-secondary font-mono break-words",children:["AMAT = ",r.l1.hitTime," + ",T(s.l1MissRate)," × (",r.l2.hitTime," + ",T(s.l2MissRate)," ×"," ",r.memoryAccessTime,") = ",e.jsxs("span",{className:"text-white font-bold",children:[T(s.amat)," cycles"]})]}),e.jsx("p",{className:"mt-1 text-[12px] text-secondary",children:"AMAT = L1 hit time + L1 miss rate × (L2 hit time + L2 miss rate × memory time). Fewer misses means a lower average."})]})},A0=[["Hit / miss","The data was already in the cache (fast), or it wasn't and had to be fetched from the next level (slow)."],["Set / way",'Each small box is one cache slot (a block). A set is a group of slots an address can map to; each slot in the group is a "way".'],["Dirty","A block that was written to and is newer than the copy in the next level. It must be written back when evicted."],["AMAT","Average Memory Access Time: the average number of CPU cycles each memory access costs. Lower is better."]],v0=()=>e.jsxs("details",{open:!0,className:"mt-4 bg-black-100 rounded-xl border border-white/10 p-4 text-[13px] text-secondary",children:[e.jsx("summary",{className:"cursor-pointer text-white font-semibold text-[14px]",children:"New to caches? Start here"}),e.jsxs("p",{className:"mt-3",children:[e.jsx("span",{className:"text-white font-semibold",children:"What is a cache?"})," Main memory is slow, so CPUs keep copies of recently used data in small, fast memories called caches. This demo models two of them: ",e.jsx("span",{className:"text-white",children:"L1"})," ","(smallest and fastest) backed by ",e.jsx("span",{className:"text-white",children:"L2"})," (larger, slower), backed by main memory."]}),e.jsxs("p",{className:"mt-2",children:[e.jsx("span",{className:"text-white font-semibold",children:"What am I watching?"})," The program replays a list of memory reads and writes. For each one, it checks L1, then L2, then memory, and lights up the slot involved: green if the data was found (hit), red if it had to be loaded (miss). Pick a preset to see how cache size, block size, associativity, and write policy change the hit rate and the average cost per access."]}),e.jsx("dl",{className:"mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-2",children:A0.map(([t,s])=>e.jsxs("div",{children:[e.jsxs("dt",{className:"inline text-white font-semibold",children:[t,": "]}),e.jsx("dd",{className:"inline",children:s})]},t))}),e.jsxs("p",{className:"mt-3",children:[e.jsx("span",{className:"text-white font-semibold",children:"Try this:"}),' press Play on the first preset, then compare it with "Direct-mapped" and "Doubled blocks" and watch the AMAT at the bottom drop. Then try "Try different workloads" to see how program behavior changes hit rates, or "Build your own cache" to design L1 and L2 yourself.']})]}),j0=t=>{if(!t)return"Press play or step to begin.";const s=o=>`set ${o.set}${o.way>=0?`, way ${o.way}`:""}`;let r=`#${t.index+1}  ${t.directive==="R"?"Read":"Write"} ${s0(t.address)} → L1 ${t.l1.hit?"hit":"miss"} (${s(t.l1)})`;return t.l2&&(r+=` → L2 ${t.l2.hit?"hit":"miss"} (${s(t.l2)})`,t.l2.hit||(r+=" → memory")),t.l1.bypass&&(r+=". L1 write bypassed (no-write-allocate)"),t.l1.writeback&&(r+=". Dirty L1 victim written back to L2"),r},M0=t=>t>=1024?`${t/1024} KB`:`${t} B`,C="bg-black-200 text-white rounded-md px-2 py-1 border border-white/20 text-[13px] w-full",D=({label:t,items:s,value:r,onChange:o,accent:i="bg-[#915eff] border-[#915eff]"})=>e.jsx("div",{className:"flex flex-wrap gap-2",role:"tablist","aria-label":t,children:s.map(n=>e.jsx("button",{role:"tab","aria-selected":n.id===r,onClick:()=>o(n.id),className:`px-3 py-1.5 rounded-lg text-[13px] border ${n.id===r?`${i} text-white`:"border-white/20 text-secondary hover:text-white hover:bg-white/10"}`,children:n.name??n.label},n.id))}),k=({label:t,title:s,children:r})=>e.jsxs("label",{className:"flex flex-col gap-1 text-[11px] uppercase tracking-wider text-secondary",title:s,children:[t,r]}),e0=({name:t,level:s,sizes:r,onChange:o})=>{const i=a=>o(I0({...s,...a})),n=s.size/s.blockSize;return e.jsxs("div",{className:"bg-black-100 rounded-xl border border-white/10 p-4",children:[e.jsx("h4",{className:"text-white font-bold text-[16px] mb-3",children:t}),e.jsxs("div",{className:"grid grid-cols-2 sm:grid-cols-3 gap-3",children:[e.jsx(k,{label:"Size",title:"Total capacity of this cache",children:e.jsx("select",{className:C,value:s.size,onChange:a=>i({size:Number(a.target.value)}),children:r.map(a=>e.jsx("option",{value:a,children:M0(a)},a))})}),e.jsx(k,{label:"Block size",title:"Bytes fetched together on a miss",children:e.jsx("select",{className:C,value:s.blockSize,onChange:a=>i({blockSize:Number(a.target.value)}),children:E0.filter(a=>a<=s.size).map(a=>e.jsxs("option",{value:a,children:[a," B"]},a))})}),e.jsx(k,{label:"Associativity",title:"How many slots (ways) each set has. 1 = direct-mapped",children:e.jsx("select",{className:C,value:s.assoc,onChange:a=>i({assoc:Number(a.target.value)}),children:S0.filter(a=>a<=n).map(a=>e.jsx("option",{value:a,children:a===1?"1 (direct-mapped)":`${a}-way`},a))})}),e.jsx(k,{label:"On write hit",title:"Write-back keeps the change in this cache until eviction. Write-through also updates the next level immediately",children:e.jsxs("select",{className:C,value:s.writeHit,onChange:a=>i({writeHit:a.target.value}),children:[e.jsx("option",{value:"wb",children:"Write-back"}),e.jsx("option",{value:"wt",children:"Write-through"})]})}),e.jsx(k,{label:"On write miss",title:"Write-allocate loads the block into this cache. No-write-allocate sends the write past it",children:e.jsxs("select",{className:C,value:s.writeMiss,onChange:a=>i({writeMiss:a.target.value}),children:[e.jsx("option",{value:"wa",children:"Write-allocate"}),e.jsx("option",{value:"nwa",children:"No-write-allocate"})]})}),e.jsx(k,{label:"Hit time (cycles)",title:"Cycles to get data when this level hits",children:e.jsx("input",{type:"number",min:1,max:1e3,className:C,value:s.hitTime,onChange:a=>i({hitTime:Math.min(1e3,Math.max(1,Math.round(Number(a.target.value))||1))})})})]})]})},N0=({config:t,onChange:s,onReset:r})=>e.jsxs("div",{className:"mt-4",children:[e.jsxs("div",{className:"grid lg:grid-cols-2 gap-4",children:[e.jsx(e0,{name:"L1 cache",level:t.l1,sizes:V.l1.sizes,onChange:o=>s({...t,l1:o})}),e.jsx(e0,{name:"L2 cache",level:t.l2,sizes:V.l2.sizes,onChange:o=>s({...t,l2:o})})]}),e.jsxs("div",{className:"mt-3 flex flex-wrap items-end gap-4",children:[e.jsx(k,{label:"Main memory time (cycles)",title:"Cycles for an access that misses both caches",children:e.jsx("input",{type:"number",min:1,max:1e3,className:`${C} w-[160px]`,value:t.memoryAccessTime,onChange:o=>s({...t,memoryAccessTime:Math.min(1e3,Math.max(1,Math.round(Number(o.target.value))||1))})})}),e.jsx("button",{onClick:r,className:"px-3 py-1.5 rounded-lg text-[13px] font-medium border border-white/20 text-white hover:bg-white/10",children:"Reset to default"})]})]}),B0=({onClose:t})=>{const[s,r]=R.useState("presets"),[o,i]=R.useState(Z[0].id),[n,a]=R.useState(U[0].id),[c,p]=R.useState(P),[x,d]=R.useState(0),[u,h]=R.useState(!0),[m,w]=R.useState(1),_=R.useRef(null),E=R.useMemo(()=>{if(s==="presets"){const y=Z.find(B=>B.id===o);return{config:y.config,trace:y.trace,title:y.tagline,description:y.description,documented:y.documented}}const l=U.find(y=>y.id===n);return{config:_0(s==="custom"?c:P),trace:l.trace,title:l.tagline,description:l.description}},[s,o,n,c]),g=R.useMemo(()=>l0(E.config,E.trace),[E]),S=g.frames.length,b=x>0?g.frames[x-1]:null,A=b?{...b.snapshot,stats:b.stats}:c0(g),v=o0(g.config,A.stats.l1,A.stats.l2),I=x===S,j=R.useCallback((l,L)=>{l(L),d(0),h(!0)},[]);R.useEffect(()=>{if(!u)return;const l=setInterval(()=>{d(L=>Math.min(S,L+J[m].perTick))},T0);return()=>clearInterval(l)},[u,m,S]),R.useEffect(()=>{I&&h(!1)},[I]),R.useEffect(()=>{var B;const l=document.activeElement,L=document.body.style.overflow;document.body.style.overflow="hidden",(B=_.current)==null||B.focus();const y=O=>{O.key==="Escape"&&t()};return window.addEventListener("keydown",y),()=>{var O;window.removeEventListener("keydown",y),document.body.style.overflow=L,(O=l==null?void 0:l.focus)==null||O.call(l)}},[t]);const M="px-3 py-1.5 rounded-lg text-[13px] font-medium border border-white/20 text-white hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent",{l1:N,l2:H}=g.config;return r0.createPortal(e.jsx("div",{className:"fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-6",onMouseDown:l=>l.target===l.currentTarget&&t(),children:e.jsxs("div",{role:"dialog","aria-modal":"true","aria-labelledby":"cache-demo-title",className:"bg-tertiary w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-2xl p-4 sm:p-6 shadow-card",children:[e.jsxs("div",{className:"flex items-start justify-between gap-4",children:[e.jsxs("div",{children:[e.jsx("h3",{id:"cache-demo-title",className:"text-white font-bold text-[24px]",children:"Cache Hierarchy Emulator"}),e.jsxs("p",{className:"text-secondary text-[13px]",children:["Watch how a CPU's fast L1 and L2 caches handle memory accesses. An in-browser port of my C++ simulator, replaying a ",S,"-access read/write trace."]})]}),e.jsx("button",{ref:_,onClick:t,"aria-label":"Close demo",className:M,children:"Close"})]}),e.jsx(v0,{}),e.jsx("p",{className:"mt-4 text-[12px] uppercase tracking-wider text-secondary",children:"Explore"}),e.jsx("div",{className:"mt-2",children:e.jsx(D,{label:"Mode",items:L0,value:s,onChange:l=>j(r,l),accent:"bg-white/15 border-white/40"})}),e.jsxs("div",{className:"mt-3",children:[s==="presets"&&e.jsx(D,{label:"Presets",items:Z,value:o,onChange:l=>j(i,l)}),s!=="presets"&&e.jsxs(e.Fragment,{children:[e.jsx("p",{className:"mb-2 text-[12px] text-secondary",children:s==="workloads"?'Same cache every time, different program behavior. Pick a workload (a pattern of memory accesses) and compare hit rates. To change the cache itself, use "Build your own cache".':"Set up L1 and L2 yourself, then choose a workload to run on them."}),e.jsx(D,{label:"Workloads",items:U,value:n,onChange:l=>j(a,l)})]})]}),s==="custom"&&e.jsx(N0,{config:c,onChange:l=>j(p,l),onReset:()=>j(p,P)}),e.jsxs("p",{className:"mt-3 text-[14px] text-white-100",children:[e.jsxs("span",{className:"font-bold",children:[E.title,"."]})," ",e.jsx("span",{className:"text-secondary",children:E.description})]}),e.jsxs("div",{className:"mt-4 flex flex-wrap items-center gap-2",children:[e.jsx("button",{className:M,onClick:()=>{I&&d(0),h(l=>I?!0:!l)},children:I?"Replay":u?"Pause":"Play"}),e.jsx("button",{className:M,disabled:I,onClick:()=>{h(!1),d(l=>Math.min(S,l+1))},children:"Step"}),e.jsx("button",{className:M,disabled:x===0,onClick:()=>{h(!1),d(0)},children:"Reset"}),e.jsx("button",{className:M,disabled:I,onClick:()=>{h(!1),d(S)},children:"Skip to end"}),e.jsxs("label",{className:"text-[13px] text-secondary flex items-center gap-2 ml-auto",children:["Speed",e.jsx("select",{value:m,onChange:l=>w(Number(l.target.value)),className:"bg-black-200 text-white rounded-md px-2 py-1 border border-white/20",children:J.map((l,L)=>e.jsx("option",{value:L,children:l.label},l.label))})]})]}),e.jsx("input",{type:"range",min:0,max:S,value:x,onChange:l=>{h(!1),d(Number(l.target.value))},"aria-label":"Trace position",className:"mt-3 w-full accent-[#915eff]"}),e.jsx("p",{className:"mt-1 text-[13px] text-white font-mono min-h-[20px]","aria-live":"polite",children:j0(b)}),e.jsxs("div",{className:"mt-4 grid lg:grid-cols-2 gap-4",children:[e.jsx(X,{title:"L1",subtitle:`${N.size} B · ${N.blockSize} B blocks · ${N.assoc}-way · ${g.geometry.l1.sets} sets · ${Q(N)}`,geo:g.geometry.l1,data:A.l1,access:b==null?void 0:b.l1}),e.jsx(X,{title:"L2",subtitle:`${H.size} B · ${H.blockSize} B blocks · ${H.assoc}-way · ${g.geometry.l2.sets} sets · ${Q(H)}`,geo:g.geometry.l2,data:A.l2,access:b==null?void 0:b.l2,writebackTarget:b==null?void 0:b.writebackTarget})]}),e.jsxs("div",{className:"mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-secondary",children:[e.jsxs("span",{children:[e.jsx("i",{className:"inline-block w-3 h-3 rounded-[3px] bg-green-500 align-middle"})," hit (data found)"]}),e.jsxs("span",{children:[e.jsx("i",{className:"inline-block w-3 h-3 rounded-[3px] bg-red-500 align-middle"})," miss (block loaded)"]}),e.jsxs("span",{children:[e.jsx("i",{className:"inline-block w-3 h-3 rounded-[3px] bg-indigo-500/50 border border-indigo-300/40 align-middle"})," holds data"]}),e.jsxs("span",{children:[e.jsx("i",{className:"inline-block w-3 h-3 rounded-[3px] bg-black-200 border border-white/10 align-middle"})," empty"]}),e.jsxs("span",{children:[e.jsx("i",{className:"inline-block w-2 h-2 rounded-full bg-amber-300 align-middle"})," dirty (modified)"]}),e.jsxs("span",{children:[e.jsx("i",{className:"inline-block w-3 h-3 rounded-[3px] border-2 border-amber-300 align-middle"})," being written back"]}),e.jsxs("span",{children:[e.jsx("i",{className:"inline-block w-3 h-3 rounded-[3px] border border-dashed border-red-400 align-middle"})," write bypassed cache"]})]}),e.jsxs("div",{className:"mt-4",children:[e.jsx(k0,{stats:A.stats,analysis:v,config:g.config}),e.jsx("p",{className:"mt-2 text-[12px] text-secondary",children:I?E.documented?T(v.amat)===E.documented?e.jsxs("span",{className:"text-green-400",children:["✓ Final AMAT ",T(v.amat)," matches the value documented in the repo write-up and the C++ simulator output."]}):e.jsxs("span",{className:"text-amber-300",children:["Final AMAT ",T(v.amat)," (documented: ",E.documented,")."]}):e.jsxs("span",{className:"text-white",children:["Final AMAT ",T(v.amat)," cycles per access."]}):`Running totals after ${x} of ${S} accesses.`})]})]})}),document.body)};export{B0 as default};
