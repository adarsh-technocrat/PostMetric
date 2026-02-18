import Image from "next/image";

export function RevenueTrackingSection() {
  return (
    <div className="flex flex-col w-full items-center">
      <div className="flex flex-col w-full max-w-4xl md:border-x border-stone-200">
        <div className="py-6 px-4 lg:px-20 lg:py-20 flex flex-col gap-6 items-center lg:pb-12">
          <div className="flex flex-col gap-3 items-center">
            <h1 className="font-cooper text-[28px] lg:text-[40px] leading-8 lg:leading-tight text-center text-balance text-stone-800">
              Connect revenue to sources—then act on it
            </h1>
            <h2 className="text-center text-balance lg:whitespace-pre-line whitespace-normal leading-6 text-stone-500 text-base lg:text-lg max-w-md">
              See how much each channel generates.
              <br className="md:block hidden" />
              Get suggested next steps to turn more visitors into paying
              customers.
            </h2>
          </div>
        </div>
      </div>
      <div className="w-full border-b border-stone-200" />
      <div className="flex flex-col w-full max-w-4xl md:border-x border-stone-200">
        <div className="flex flex-col items-center w-full px-4 lg:px-6 py-10">
          <div className="relative w-full aspect-video bg-stone-50 rounded-xl border border-stone-200 overflow-hidden flex items-center justify-center">
            <Image
              src="https://datafa.st/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Frevenue_2.d41716c4.png&w=3840&q=75"
              alt="Revenue Tracking"
              width={3840}
              height={2160}
              className="object-contain w-full h-full"
            />
          </div>
        </div>
      </div>
      <div className="w-full border-b border-stone-200" />
    </div>
  );
}
