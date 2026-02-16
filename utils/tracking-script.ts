export const TRACKING_SCRIPT_PLACEHOLDER = `<script
  defer
  data-website-id="pmid_xxxx"
  data-domain="your-domain.com"
  src="https://your-domain.com/js/script.js"
></script>`;

export function getTrackingScriptCode(
  websiteId: string,
  domain: string,
  scriptOrigin: string,
  options?: { allowLocalhost?: boolean },
): string {
  const localhostAttr = options?.allowLocalhost
    ? '\n  data-allow-localhost="true"'
    : "";
  return `<script
  defer
  data-website-id="${websiteId}"
  data-domain="${domain}"${localhostAttr}
  src="${scriptOrigin}/js/script.js"
></script>`;
}
