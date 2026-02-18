import Image from "next/image";

export function InsightsSection() {
  return (
    <div className="flex flex-col w-full items-center">
      <div className="flex flex-col w-full max-w-4xl md:border-x border-stone-200">
        <div className="py-6 px-4 lg:px-20 lg:py-20 flex flex-col gap-6 items-center lg:pb-12">
          <div className="flex flex-col gap-3 items-center">
            <h1 className="font-cooper text-[28px] lg:text-[40px] leading-8 lg:leading-tight text-center text-balance text-stone-800">
              Understand your audience—and what to do next
            </h1>
            <h2 className="text-center text-balance lg:whitespace-pre-line whitespace-normal leading-6 text-stone-500 text-base lg:text-lg max-w-md">
              Visualize traffic, behavior, and conversion paths.
              <br className="md:block hidden" />
              Get clear recommendations so you can act on the data, not just
              view it.
            </h2>
          </div>
        </div>
      </div>
      <div className="w-full border-b border-stone-200" />
      <div className="flex flex-col w-full max-w-4xl md:border-x border-stone-200">
        <div className="flex flex-col items-center w-full px-4 lg:px-6 py-10">
          <div className="relative w-full aspect-video bg-stone-50 rounded-xl border border-stone-200 overflow-hidden">
            <Image
              src="https://datafa.st/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fchart.3ff767a4.png&w=1080&q=50"
              alt="Analytics Dashboard"
              width={1080}
              height={608}
              className="object-cover w-full h-full"
            />
          </div>
        </div>
      </div>
      <div className="w-full border-b border-stone-200" />
    </div>
  );
}
