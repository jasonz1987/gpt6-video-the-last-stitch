export const FPS=30;
export const DURATION=100;
export const SHOTS=[
 {id:'window',start:0,end:12,label:'今日的窗边',description:'晨光穿过窗棂，木桌上的小旗轻动。旧针线盒打开，镜头推进到一枚针。'},
 {id:'missing',start:12,end:18,label:'少了一角',description:'暖色缝制间，黄缎旁的星角缺口。镜头下沉，找到等待接合的两边。'},
 {id:'stitch',start:18,end:36,label:'那一针',description:'针穿过缎面，线环被拉紧，接缝闭合。相机沿同一方向退开，露出完整旗面。'},
 {id:'bundle',start:36,end:45,label:'装好出发',description:'旗面先折短，再从右侧卷起，麻绳收紧。完整的一角藏进红色布卷。'},
 {id:'wheel',start:45,end:50,label:'车轮',description:'低机位贴近转动的自行车轮，路面和石缝从下方滑过。'},
 {id:'courier',start:50,end:57,label:'送旗',description:'侧向跟拍匿名骑车送旗者，灰墙、灯柱、瓦檐形成前中后景。'},
 {id:'arrival',start:57,end:62,label:'抵达',description:'镜头落到车后红布卷，再抬高看向巷口明亮的出口。'},
 {id:'rise',start:62,end:70,label:'升起',description:'1949年十月一日午后。绳与旗沿着旗杆向上；人群和建筑保持在远景。'},
 {id:'sky',start:70,end:80,label:'天空',description:'低角度红旗在天空中展开，风沿着同一块布面向外传递。'},
 {id:'return',start:80,end:91,label:'回到今天',description:'五星位置匹配剪辑到窗边的小旗。拉开后露出针线盒与一杯热茶。'},
 {id:'home',start:91,end:100,label:'每一扇窗',description:'摄影退到窗外，温暖的房间融入城市。片名、祝福和制作署名落定，留出停顿。'}
] as const;
export const CAPTIONS=[
 {start:4.2,end:9.8,zh:'今天的红，曾被一针一线缝起。',en:'Today’s red was once stitched by hand.'},
 {start:13.0,end:17.6,zh:'黄缎不够宽，星角差了一块。',en:'The satin was too narrow. One point was missing.'},
 {start:29.2,end:35.3,zh:'一小块布，让一颗星完整。',en:'A small piece made the star whole.'},
 {start:38.0,end:43.8,zh:'最后一针，也有它要去的地方。',en:'The last stitch had somewhere to go.'},
 {start:51.2,end:56.3,zh:'天亮了，出发。',en:'At first light, it set off.'},
 {start:72.0,end:78.8,zh:'这一针，后来升到了天空。',en:'That stitch rose into the sky.'},
 {start:84.5,end:90.6,zh:'愿每一扇窗，都有好日子。',en:'May every home have brighter days.'}
];
