export const coats = [
 {key:'orange',name:'橘猫',family:'orange',dilute:false,pattern:'橘色虎斑',white:'浅色鼻口、胸腹'},
 {key:'cream',name:'奶油猫',family:'orange',dilute:true,pattern:'奶油虎斑',white:'浅色鼻口、胸腹'},
 {key:'tabby',name:'狸花',family:'tabby',dilute:false,pattern:'黑色系虎斑',white:'无典型白斑'},
 {key:'blueTabby',name:'蓝狸花',family:'tabby',dilute:true,pattern:'蓝色系虎斑',white:'无典型白斑'},
 {key:'black',name:'纯黑',family:'solid',dilute:false,pattern:'纯色',white:'无白斑'},
 {key:'blue',name:'纯蓝灰色',family:'solid',dilute:true,pattern:'纯色',white:'无白斑'},
 {key:'tuxedo',name:'黑白',family:'bicolor',dilute:false,pattern:'双色',white:'白胸、白袜'},
 {key:'blueWhite',name:'蓝白',family:'bicolor',dilute:true,pattern:'双色',white:'白鼻口、白胸、白袜'},
 {key:'calico',name:'三花',family:'calico',dilute:false,pattern:'黑橘白斑块',white:'白鼻口、胸腹和四爪'},
 {key:'diluteCalico',name:'淡三花',family:'calico',dilute:true,pattern:'蓝奶油白斑块',white:'白鼻口、胸腹和四爪'},
 {key:'tortie',name:'玳瑁',family:'tortie',dilute:false,pattern:'黑橘交错斑块',white:'无白斑'},
] as const;
export function findCoat(family:string,dilute:boolean){return coats.find(c=>c.family===family&&c.dilute===dilute)??coats.find(c=>c.family===family)!;}
