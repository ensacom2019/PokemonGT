document.title='\uD3EC\uCF13\uBAAC G \uD1A0\uB108\uBA3C\uD2B8';
const brand=document.querySelector('.brand');
if(brand)brand.setAttribute('aria-label','\uD3EC\uCF13\uBAAC G \uD1A0\uB108\uBA3C\uD2B8 \uD648');
const brandTitle=document.querySelector('.brand > span:last-child');
if(brandTitle)brandTitle.innerHTML='\uD3EC\uCF13\uBAAC <span class="brand-accent">G</span> \uD1A0\uB108\uBA3C\uD2B8';
const startTitle=document.querySelector('#start-title');
if(startTitle)startTitle.innerHTML='\uD3EC\uCF13\uBAAC<br /><em>G \uD1A0\uB108\uBA3C\uD2B8</em>';
document.querySelector('.rule-chips')?.remove();
