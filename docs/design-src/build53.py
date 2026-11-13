import json,sys,os,re
SP=sys.argv[1]; VID=sys.argv[2]
sys.path.insert(0, os.path.join(SP,'canvas-src'))
src=open(os.path.join(SP,'canvas-src','build.py'),encoding='utf-8').read()
B=eval(re.search(r'B=(\{.*?\})\nu=',src,re.S).group(1))
B.update({
'appendix-poster.jpg':'c72283d38cc81c3084bc5abed9d50394','appendix-thumb.webp':'d9d97f08a9a2aab127ef8d2a0aa566f1','appendix.mp4':'bf6f4225ddbf99543f2fc78d107462b7',
'appendix__p0-s.webp':'94df35112e0befab4f2460400e3ce9f0','appendix__p1-s.webp':'ca47f371ad0ccd4247bb736f50b46c9e',
'dark-matter-poster.jpg':'06263ca7228974e05abe33f759257714','dark-matter-thumb.webp':'6cf4b94a1f6244a9a8c33f5751183405','dark-matter.mp4':'81d18fff791c065fcdd793015e42f7f2',
'dark-matter__p0-s.webp':'09f0f16d3d9c8ebe101977257d158127','dark-matter__p1-s.webp':'b2ebb10417266c71894290371c0cf4ee','dark-matter__p2-s.webp':'f51b0bf793047259afdbde00b7af4862',
'dna__p0-s.webp':'f42ec8889ef42d0c1ce3cfb437161913','dna__p1-s.webp':'4719dafb12fd3af57327ff85e2f02694','dna__p2-s.webp':'dc7a4d61f7fe344d3f83e2b6a0a5135e',
'headaches__p0-s.webp':'0e290db0785247dbf8edd4b5abf345ca','headaches__p1-s.webp':'f9dfe9e56fb7f226a1e95cec3ee00f9d',
'insurance__p0-s.webp':'3d5ac84e8ff314367261a1dd682048d4','insurance__p1-s.webp':'7294426432ef384cb498bbc6f98c2970',
'kidneys-poster.jpg':'aef759648bf549c2aa88a1770787159d','kidneys-thumb.webp':'dcbd8b9fd8763e38c34ad4acf7f225c9','kidneys.mp4':'c337f85734d7e12e8846b2da31ba566e',
'kidneys__p0-s.webp':'77091c935253a52a8c07132fef3b235b','kidneys__p1-s.webp':'63bdda09a9658b06c47da28501522686','kidneys__p2-s.webp':'5b7d26e5ebe92217bb62f64eb06b98a3',
'neurons-poster.jpg':'0bb9584e6245f5e8f9512e4206c36f5b','neurons-thumb.webp':'4b61c60774d82c6af8b12f960e35ae54','neurons.mp4':'f030505b72a1b9df2ae2ce7bc50d94de',
'neurons__p0-s.webp':'9104fb163aab9ecf83a292e9ea873fbe','neurons__p1-s.webp':'25810f5534f49e39a09282c45b7f9ef4','neurons__p2-s.webp':'33122231e1bc979378191c27d3212f65',
'ocean__p0-s.webp':'455308f15a607706f9941fdb85f27a93','ocean__p1-s.webp':'58b13de5aa582b5ffe6af97cbf6e85eb',
'polar-bear__p0-s.webp':'9b27ccf7c39d93b26f21d5a234f1a187','polar-bear__p1-s.webp':'ce98c682c471312c2ecc4142a967adef','polar-bear__p2-s.webp':'0ec025acbc5a85bc0e7fc254a7e7d836',
'rocket__p0-s.webp':'db8c6a6559a01a720fbf93bde74e766d','rocket__p1-s.webp':'e4f6fb17133c7722ce328ff4d20c9c19',
'supernova-poster.jpg':'0e6f5d7828227fa56f047f64e0552ef3','supernova-thumb.webp':'99a3f3c84ecc32b45fc6bd23512c51fd','supernova.mp4':'bf6e76ea462531dc82688953af932bcc',
'supernova__p0-s.webp':'0e442cfc836797be7fde4344ef57bdeb','supernova__p1-s.webp':'208c90b491290bd498e9b1ba43c5fbf4','supernova__p2-s.webp':'a8b5371406687028d8e45706ee7fbe2d',
'tv__p0-s.webp':'5c4a9ec69f23c2ce9867b85ca2384120','tv__p1-s.webp':'a0e74230fd5397fc43b5477274625496',
'zombie-cells-poster.jpg':'9b87708481c30159147b94a1948aeba9','zombie-cells-thumb.webp':'cb9f827c62af19305a938963fef97646','zombie-cells.mp4':'2f2ab7db0bb35815aafb79c2125d4290',
'zombie-cells__p0-s.webp':'2365810ef6fcaeba5c8c8ffdaa3e9fef','zombie-cells__p1-s.webp':'de472c2b28b8099103a46edc8dd33186'})
u=lambda f:'/_blob/'+B[f]
V={}
SL=['rocket','headaches','dna','ocean','polar-bear','insurance','tv','neurons','zombie-cells','kidneys','appendix','supernova','dark-matter']
r=lambda x:[{'start':round(c['start'],2),'end':round(c['end'],2),'text':c['text']} for c in x]
for s in SL:
  d=json.load(open(os.path.join(VID,s+'.json'),encoding='utf-8'))
  sh=[{'title':x.get('title',''),'start':round(x['start'],2),'thumb':u('%s__p%d-s.webp'%(s,x['index']))} for x in d['sheets']]
  V[s]={'title':d['title'],'duration':round(d['duration'],1),'cues':r(d['cues']),'src':u(s+'.mp4'),'poster':u(s+'-poster.jpg'),'thumb':u(s+'-thumb.webp'),'sheets':sh}
t=open(os.path.join(SP,'canvas-src','V53.template.html'),encoding='utf-8').read()
js=json.dumps(V,ensure_ascii=False).replace('</','<\/')
t=t.replace('__DATA__',js).replace('__DEMO_SRC__',u('tubelight-demo.mp4')).replace('__DEMO_POSTER__',u('tubelight-demo-poster.jpg'))
t=t.replace('__SHEET_kidneys_0__',u('kidneys__p0-s.webp')).replace('__SHEET_zombie-cells_1__',u('zombie-cells__p1-s.webp'))
for s in V: t=t.replace('__THUMB_'+s+'__',V[s]['thumb'])
left=[l for l in t.split('\n') if re.search(r'__[A-Z]+_',l)]
assert not left, left[:3]
os.makedirs(os.path.join(SP,'canvas','project'),exist_ok=True)
open(os.path.join(SP,'canvas','project','V53.dc.html'),'w',encoding='utf-8').write(t)
m=t.replace('<title>Tubelight — v5.3</title>','<title>Tubelight — v5.3 phone</title>')
open(os.path.join(SP,'canvas','project','V53m.dc.html'),'w',encoding='utf-8').write(m)
print(len(t))
