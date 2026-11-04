# gera as texturas de detalhe (assets/tex/*.jpg) por ruído filtrado em frequência: emendam sem costura e são 100% nossas
# uso: python3 -I tools/gentex.py (grava tex_terrain.jpg e tex_walls.jpg na pasta atual)
import numpy as np
from PIL import Image
N=1024; rng=np.random.default_rng(7)
fy=np.fft.fftfreq(N)[:,None]; fx=np.fft.fftfreq(N)[None,:]
def noise(scale, aniso=(1,1), power=2.0):
    # ruído filtrado em frequência: é periódico, então a textura emenda sem costura
    w=rng.standard_normal((N,N)); f=np.sqrt((fx*aniso[0])**2+(fy*aniso[1])**2)+1e-6
    filt=np.exp(-(f*scale)**2)*(f**-0.2)
    if power!=2.0: filt=filt**(power/2)
    n=np.real(np.fft.ifft2(np.fft.fft2(w)*filt)); n=(n-n.mean())/(n.std()+1e-9); return n
def fbm(scales, weights, aniso=(1,1)):
    return sum(w*noise(s,aniso) for s,w in zip(scales,weights))
def norm(a, lo=0.25, hi=0.75):
    a=(a-np.percentile(a,1))/(np.percentile(a,99)-np.percentile(a,1)+1e-9); return np.clip(lo+a*(hi-lo),0,1)
def dots(n, rmin, rmax, val):
    img=np.zeros((N,N)); yy,xx=np.mgrid[0:N,0:N]
    for _ in range(n):
        cx,cy=rng.integers(0,N,2); r=rng.uniform(rmin,rmax)
        dx=(xx-cx+N/2)%N-N/2; dy=(yy-cy+N/2)%N-N/2
        img=np.maximum(img,np.clip(1-np.sqrt(dx*dx+dy*dy)/r,0,1)*val*rng.uniform(0.6,1))
    return img
# ---- chão ----
grass = norm(fbm([3,10,40],[0.9,0.6,0.5]) + 1.2*noise(2,(1,9)) + 0.8*noise(1.2,(9,1)), 0.18, 0.82)  # folhinhas em duas direções + tufos
yy,xx=np.mgrid[0:N,0:N]
crack = np.abs(noise(60)) ; crack = np.clip(1-crack*8,0,1)**3
dirt = norm(fbm([4,18,70],[0.7,0.6,0.6]),0.3,0.7) - crack*0.25
peb = dots(900, 2, 6, 0.35); dirt = np.clip(dirt + peb - dots(500,1.5,4,0.2),0,1)
ridge = 1-np.abs(noise(30)); rock = norm(fbm([3,12,45,140],[0.5,0.6,0.7,0.8]) + 0.7*ridge, 0.2, 0.8)
Image.fromarray((np.dstack([grass,dirt,rock])*255).astype(np.uint8)).save('tex_terrain.jpg',quality=86)
# ---- paredes ----
streak = noise(3,(14,0.4))  # escorridos verticais
stain = norm(fbm([60,200],[1,0.7]),0,1)
plaster = norm(fbm([2,8,30],[0.5,0.5,0.4]) + 0.6*streak - 1.0*(stain>0.72)*(stain-0.72)*4, 0.3, 0.72)
grain = noise(2,(0.15,12)) + 0.6*noise(6,(0.3,6)) + 0.5*noise(40)
knots = dots(14, 8, 18, 0.6)
wood = norm(grain - knots*1.5, 0.22, 0.78)
rust = norm(fbm([12,50],[1,0.8]),0,1); rust = np.clip((rust-0.55)*3,0,1)
metal = norm(0.7*noise(1.5) + 0.9*streak + 0.4*noise(20), 0.42, 0.72) - rust*0.32
Image.fromarray((np.dstack([plaster,wood,np.clip(metal,0,1)])*255).astype(np.uint8)).save('tex_walls.jpg',quality=86)
print('ok')
