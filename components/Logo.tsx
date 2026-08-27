import Image from "next/image";

export function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <Image
      src="/brand/logo.png"
      alt="Tubelight"
      width={985}
      height={332}
      priority
      className={`${className} w-auto`}
    />
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
