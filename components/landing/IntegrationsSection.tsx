import Image from "next/image";

// Simple Icons CDN – reliable, consistent SVG logos (slug/color format)
const ICON_BASE = "https://cdn.simpleicons.org";
const INTEGRATIONS = [
  { name: "Next.js", slug: "nextdotjs", color: "000000" },
  { name: "React", slug: "react", color: "61DAFB" },
  { name: "Vue", slug: "vuedotjs", color: "4FC08D" },
  { name: "PHP", slug: "php", color: "777BB4" },
  { name: "Laravel", slug: "laravel", color: "FF2D20" },
  { name: "WordPress", slug: "wordpress", color: "21759B" },
  { name: "Webflow", slug: "webflow", color: "4353FF" },
  { name: "Framer", slug: "framer", color: "0055FF" },
  { name: "Shopify", slug: "shopify", color: "7AB55C" },
  { name: "Squarespace", slug: "squarespace", color: "000000" },
  { name: "Wix", slug: "wix", color: "0C6EFC" },
  { name: "Ghost", slug: "ghost", color: "15171A" },
];

export function IntegrationsSection() {
  return (
    <div className="flex flex-col w-full items-center">
      <div className="flex flex-col w-full max-w-4xl md:border-x border-stone-200">
        <div className="py-6 px-4 lg:px-20 lg:py-20 flex flex-col gap-6 items-center lg:pb-12">
          <div className="flex flex-col gap-3 items-center">
            <h1 className="font-cooper text-[28px] lg:text-[40px] leading-8 lg:leading-tight text-center text-balance text-stone-800">
              Works with your stack
            </h1>
            <h2 className="text-center text-balance lg:whitespace-pre-line whitespace-normal leading-6 text-stone-500 text-base lg:text-lg max-w-md">
              Install in minutes.
              <br className="md:block hidden" />
              Compatible with all major frameworks and platforms.
            </h2>
          </div>
        </div>
      </div>
      <div className="w-full border-b border-stone-200" />
      <div className="flex flex-col w-full max-w-4xl md:border-x border-stone-200">
        <div className="flex flex-col items-center w-full px-4 lg:px-6 py-10">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-8 w-full">
            {INTEGRATIONS.map((integration) => (
              <div
                key={integration.slug}
                className="group flex flex-col items-center gap-3 p-5 bg-white rounded-xl border border-stone-200 transition-all"
              >
                <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                  <Image
                    src={`${ICON_BASE}/${integration.slug}/${integration.color}`}
                    alt={integration.name}
                    width={48}
                    height={48}
                    className="object-contain w-full h-full grayscale opacity-90 transition-all group-hover:grayscale-0 group-hover:opacity-100"
                    unoptimized
                  />
                </div>
                <span className="text-xs font-medium text-stone-600 text-center">
                  {integration.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="w-full border-b border-stone-200" />
    </div>
  );
}
