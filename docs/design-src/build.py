import json,sys,os
SP=sys.argv[1]; VID=sys.argv[2]
B={'dna-poster.jpg':'74d24d59e9c9e1b7edc71f177296f87d','dna-thumb.webp':'3785ebf7bf3d369527882dd934cf7154','dna.mp4':'659792dc88f91e4bfb20e99ed525106d',
'headaches-poster.jpg':'3f5d89567d4692ae6bc35d995587bffd','headaches-short.mp4':'55bcaa4492319c06a266c69c73d2c976','headaches-thumb.webp':'5fa36ee101e15918f16afd36d317ec9d','headaches.mp4':'a4a152e693fa8bfbc329eb6b536e2f92',
'insurance-poster.jpg':'c280a886893e6abc5a76f2523e569770','insurance-thumb.webp':'00034048a2c6a44c0218c5ddcd460491','insurance.mp4':'03f5315afbb1f641682cc1ed6017983c',
'ocean-poster.jpg':'af7bb635ffb56ed21ae57d5a7f206b78','ocean-thumb.webp':'ab31e702361997deb63397ea82209562','ocean.mp4':'e0afb311cfc0fae3cd515769e2d434f6',
'polar-bear-poster.jpg':'6e75ffe12a1a1645f6da28bed322bf30','polar-bear-thumb.webp':'9a82409689521c89ad8d9e28ce93fe91','polar-bear.mp4':'136365982a0bc8ff624183d1ee14b3a1',
'rocket-poster.jpg':'88c3f5b595f925f6dc6a5165055b8cf8','rocket-short.mp4':'62e0bb2e006036ec2ec5251d67bea040','rocket-thumb.webp':'a1e4aadb6aca526da337cc54a2ebf9d5','rocket.mp4':'8969df1133d7f726cfc1210928bb528f',
'tubelight-demo-poster.jpg':'828d2b83609dd0081b8e3983e2be4bd1','tubelight-demo.mp4':'e2e6669312cf5bf68f1ccd989f0fed00',
'tv-poster.jpg':'9936381c6664c8c1605a3e1b5d01b650','tv-thumb.webp':'459a2c42bce40e643c743cd3572c64ca','tv.mp4':'98564bed9215bf2f6cd3d1ffb4fe9ead'}
u=lambda f:'/_blob/'+B[f]
V={}
for s in ['rocket','headaches','dna','ocean','polar-bear','insurance','tv']:
  d=json.load(open(os.path.join(VID,s+'.json'),encoding='utf-8'))
  r=lambda x:[{'start':round(c['start'],2),'end':round(c['end'],2),'text':c['text']} for c in x]
  o={'title':d['title'],'duration':round(d['duration'],1),'cues':r(d['cues']),'src':u(s+'.mp4'),'poster':u(s+'-poster.jpg'),'thumb':u(s+'-thumb.webp')}
  if s+'-short.mp4' in B:
    o['shortSrc']=u(s+'-short.mp4'); o['shortDuration']=round(d['shortDuration'],1); o['shortCues']=r(d['shortCues'])
  V[s]=o
t=open(os.path.join(SP,'canvas-src','V5.template.html'),encoding='utf-8').read()
js=json.dumps(V,ensure_ascii=False).replace('</','<\/')
t=t.replace('__DATA__',js).replace('__DEMO_SRC__',u('tubelight-demo.mp4')).replace('__DEMO_POSTER__',u('tubelight-demo-poster.jpg'))
for s in V: t=t.replace('__THUMB_'+s+'__',V[s]['thumb'])
assert '__' not in t.replace('__proto__',''), [l for l in t.split('\n') if '__' in l][:3]
open(os.path.join(SP,'canvas','project','V5.dc.html'),'w',encoding='utf-8').write(t)
print(len(t))
