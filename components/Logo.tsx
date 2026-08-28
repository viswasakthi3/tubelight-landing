import Image from "next/image";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-3 sm:gap-3.5 ${className}`}>
      <Image
        src="/brand/mark.png"
        alt=""
        width={307}
        height={332}
        priority
        className="h-9 w-auto sm:h-10.5 object-contain shrink-0"
      />
      <span className="text-[1.5rem] sm:text-[1.75rem] font-bold tracking-tight text-ink leading-none font-sans select-none">
        tubelight
      </span>
    </div>
  );
}

export function Mark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <Image
      src="/brand/mark.png"
      alt=""
      width={307}
      height={332}
      className={`${className} object-contain`}
    />
  );
}
