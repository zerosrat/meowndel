export const N=1000;
export const canvas=()=>Object.assign(document.createElement('canvas'),{width:N,height:N});
export async function loadMaster(file,cell){
 const img=new Image();img.src='flat-assets/'+file;await img.decode();
 const out=canvas(),ctx=out.getContext('2d',{willReadFrequently:true});
 const width=cell===undefined?img.width:img.width/2;
 ctx.drawImage(img,(cell||0)*width,0,width,img.height,0,0,N,N);
 return out;
}
export const domesticCoats = [
  {id:'black',name:'黑猫',base:'#555756',desc:'柔和炭黑底色，保留纸感和明暗。'},
  {id:'white',name:'白猫',base:'#fff6e8',desc:'暖白底色，保留原底稿的形体阴影。'},
  {id:'orange',name:'橘猫',base:'#f5b369',stripe:'#cb783e',desc:'橘色底毛 + 额头、脸颊、身体和尾巴条纹。'},
  {id:'tabby',name:'狸花',base:'#b6a18a',stripe:'#665444',desc:'暖灰棕底毛 + 深棕条纹。'},
  {id:'bicolor',name:'橘白',base:'#f5b369',stripe:'#cb783e',white:true,desc:'橘色底毛 + 条纹 + 面部、胸口、脚掌和尾尖白斑。'},
  {id:'calico',name:'三花',base:'#fff6e8',patch:true,white:true,desc:'暖白底毛 + 橘色与炭黑色块；白斑层修整面部、胸口和脚掌。'}
];
export function domesticRenderer(master){
 const source=master.getContext('2d').getImageData(0,0,N,N);
 const map=canvas(),mc=map.getContext('2d',{willReadFrequently:true});
function path(d,color){mc.fillStyle=color;mc.fill(new Path2D(d));}
function stripes(color){
  // Pattern coordinates share the neutral master's fixed square coordinate system.
  [
    'M365 159 Q393 144 419 158 Q422 216 401 252 Q383 249 365 159Z',
    'M438 155 L480 162 Q481 227 456 270 Q435 255 438 155Z',
    'M507 166 L546 179 Q539 234 516 260 Q498 241 507 166Z',
    'M246 265 Q282 268 306 288 Q273 289 246 281Z',
    'M235 300 Q270 299 300 319 Q271 321 239 317Z',
    'M653 296 Q623 313 606 329 Q640 324 674 309Z',
    'M683 339 Q649 343 615 361 Q646 365 688 355Z',
    'M620 535 Q641 549 656 568 Q641 613 609 631 Q615 580 620 535Z',
    'M673 603 Q695 625 708 649 Q688 686 650 709 Q680 653 673 603Z',
    'M716 694 Q736 719 740 740 Q707 780 671 783 Q704 741 716 694Z',
    'M313 676 Q353 681 398 711 L414 740 Q354 729 315 706Z',
    'M319 755 Q358 765 422 789 L427 815 Q365 806 325 784Z',
    'M483 729 Q529 730 585 697 L576 729 Q543 754 478 758Z',
    'M474 804 Q522 813 565 782 L555 814 Q512 839 469 831Z',
    'M728 570 Q774 550 845 586 L859 614 Q787 584 729 601Z',
    'M751 656 Q797 635 873 666 L883 699 Q811 665 764 687Z',
    'M787 745 Q842 721 895 748 L898 785 Q842 754 789 784Z',
    'M780 835 Q832 813 881 843 L863 875 Q818 847 767 868Z',
    'M722 905 Q757 875 792 905 L777 937 L720 938Z'
  ].forEach(d=>path(d,color));
}
function patches(){
  path('M270 30 L461 30 Q484 124 475 207 Q462 284 417 311 Q340 339 254 378 L180 290Z','#e7a15d');
  path('M574 81 L760 102 L773 405 Q689 427 619 403 Q568 382 555 335 Q529 261 556 202Z','#56534f');
  path('M283 557 Q341 519 375 573 Q411 625 386 695 Q351 755 286 735Z','#56534f');
  path('M635 527 Q740 585 754 716 Q711 749 661 714 Q601 685 603 613Z','#e7a15d');
  path('M666 784 Q769 751 790 872 L754 957 L636 952 Q584 847 666 784Z','#56534f');
  path('M751 433 L929 445 L934 740 Q854 734 794 680 Q747 626 751 433Z','#e7a15d');
  path('M771 734 Q837 709 913 768 L918 865 Q829 829 771 819Z','#56534f');
}
function whites(){
  const white='#fff6e8';
  path('M458 289 Q437 338 391 361 Q325 389 252 401 L255 471 L684 486 L686 420 Q588 416 542 380 Q491 345 458 289Z',white);
  path('M358 438 Q465 458 581 461 Q565 514 595 550 Q565 597 551 664 L532 649 L502 712 L491 688 L463 754 L439 699 L421 716 Q406 657 372 625 L383 608 Q353 572 342 544Z',white);
  path('M308 913 Q345 883 386 904 Q420 875 453 908 Q503 876 549 910 Q592 881 635 923 L652 999 L291 999Z',white);
  path('M740 467 L920 454 L922 542 Q887 555 864 547 L865 562 L844 550 L842 567 L822 553 L811 571 Q773 566 746 554Z',white);
}
function render(coat,pattern=true,white=true){
  mc.fillStyle=coat.base;mc.fillRect(0,0,N,N);
  if(pattern){if(coat.stripe)stripes(coat.stripe);if(coat.patch)patches();}
  if(white&&coat.white)whites();
  const pigment=mc.getImageData(0,0,N,N).data;
  const output=new ImageData(new Uint8ClampedArray(source.data),N,N), pixels=output.data;
  for(let i=0;i<pixels.length;i+=4){
    if(!pixels[i+3])continue;
    const r=source.data[i],g=source.data[i+1],b=source.data[i+2];
    const chroma=Math.max(r,g,b)-Math.min(r,g,b);
    const x=(i/4)%N,y=Math.floor(i/4/N);
    // Explicitly protect white eye glints along with all colored facial/ear/ink pixels.
    const eye=(Math.hypot((x-394)/36,(y-304)/42)<1.15)||(Math.hypot((x-556)/40,(y-341)/39)<1.15);
    if((eye&&r>240&&g>240&&b>240)||chroma>19||r<115)continue;
    const coverage=Math.min(1,Math.max(0,(20-chroma)/9));
    const shade=Math.min(1.08,(r+g+b)/3/222);
    for(let c=0;c<3;c++)pixels[i+c]=source.data[i+c]*(1-coverage)+Math.min(255,pigment[i+c]*shade)*coverage;
  }
  const out=canvas();out.getContext('2d').putImageData(output,0,0);return out;
}
return {master,render,source};
}
