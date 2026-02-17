import Image from "next/image";
import { LANDING_MAX_W } from "@/lib/landing-layout";

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
    <div className="flex flex-col w-full px-4 lg:px-6 gap-10 items-center py-24 border-b border-stone-200">
      <div className="flex flex-col gap-4 items-center max-w-2xl">
        <p className="text-stone-800 font-normal text-xs uppercase font-mono leading-4 tracking-wider">
          Integrations
        </p>
        <div className="flex flex-col gap-2 items-center">
          <h3 className="text-stone-800 font-normal text-3xl lg:text-4xl font-cooper text-center leading-tight">
            Works with your stack
          </h3>
          <p className="text-stone-500 font-normal text-base text-center leading-relaxed">
            Install in minutes. Compatible with all major frameworks and
            platforms.
          </p>
        </div>
      </div>

      <div className={`w-full ${LANDING_MAX_W}`}>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-8">
          {INTEGRATIONS.map((integration, index) => (
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
  );
}
