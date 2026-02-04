 'use client'
 
 import Image from 'next/image'
 
 export type AnimatedTorchProps = {
   /** Mirror horizontally (useful for symmetric layouts). */
   mirror?: boolean
   /** Size preset. */
   size?: 'sm' | 'md' | 'lg'
   /** Disable the orange radial glow behind the flame. */
   glow?: boolean
   className?: string
 }
 
 const SIZE_MAP = {
   sm: { torch: 40, torchClass: 'w-10', fireClass: 'w-6', glowClass: 'w-[3rem] h-[3rem]' },
   md: { torch: 64, torchClass: 'w-16', fireClass: 'w-10', glowClass: 'w-[5rem] h-[5rem]' },
   lg: { torch: 80, torchClass: 'w-20', fireClass: 'w-12', glowClass: 'w-[6rem] h-[6rem]' },
 } as const
 
 export function AnimatedTorch({
   mirror = false,
   size = 'md',
   glow = true,
   className = '',
 }: AnimatedTorchProps) {
   const s = SIZE_MAP[size]
 
   return (
     <div
       className={`relative ${s.torchClass} flex-shrink-0 ${mirror ? '-scale-x-100' : ''} ${className}`}
       aria-hidden
     >
       <Image
         src="/torch.png"
         alt=""
         width={s.torch}
         height={s.torch * 2}
         className="w-full h-auto object-contain"
         unoptimized
       />
 
       <div className="absolute inset-0 flex justify-center top-0">
         <div className={`relative ${s.fireClass} mt-0.5`}>
           {glow && (
             <div
               className={`absolute left-1/2 ${s.glowClass} -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none`}
               style={{
                 top: 'calc(50% - 12px)',
                 background:
                   'radial-gradient(circle, rgba(251, 146, 60, 0.4) 0%, rgba(251, 146, 60, 0.15) 40%, transparent 70%)',
               }}
             />
           )}
 
           {/* eslint-disable-next-line @next/next/no-img-element -- animated gif; next/image not needed */}
           <img
             src="/fire-animation.gif"
             alt=""
             className="relative w-full h-auto object-contain object-top"
           />
         </div>
       </div>
     </div>
   )
 }
